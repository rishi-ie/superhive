import { existsSync, readFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import log from 'electron-log/main'
import { isPackagedApp, runtimeRoot } from './runtime-paths'
import { RUNTIME_COMPATIBILITY_VERSION } from '../scripts/runtime-compatibility'
import { loadRuntimeBundleManifest } from './runtime-bundle-manifest'

const PI_ENTRY = ['general-kai', 'pi', 'packages', 'coding-agent', 'dist', 'cli.js']
const EXTENSIONS = Object.keys(loadRuntimeBundleManifest().extensions)

let preparing: Promise<void> | null = null

export function isRuntimePrepared(root = runtimeRoot()): boolean {
	const assetsReady = existsSync(join(root, ...PI_ENTRY)) &&
		EXTENSIONS.every((name) => existsSync(join(root, 'extensions', name, 'index.ts')))
	if (!assetsReady) return false
	if (isPackagedApp()) return true
	try {
		const manifest = JSON.parse(readFileSync(join(root, 'runtime-manifest.json'), 'utf8')) as { version?: number }
		return manifest.version === RUNTIME_COMPATIBILITY_VERSION
	} catch {
		return false
	}
}

function bunExecutable(): string {
	const candidate = process.env.BUN_INSTALL
		? join(process.env.BUN_INSTALL, 'bin', process.platform === 'win32' ? 'bun.exe' : 'bun')
		: ''
	return candidate && existsSync(candidate) ? candidate : process.platform === 'win32' ? 'bun.exe' : 'bun'
}

/**
 * Development uses a single per-user prepared runtime. The first agent or
 * project creation materializes it from sibling checkouts when present, or
 * from pinned Git refs after a normal Superhive-only clone.
 */
export async function ensureRuntimePrepared(): Promise<void> {
	if (isPackagedApp()) {
		if (!isRuntimePrepared()) throw new Error('The bundled Pi runtime is incomplete. Reinstall Superhive.')
		return
	}
	if (isRuntimePrepared()) return
	if (preparing) return preparing

	const root = runtimeRoot()
	const appRoot = dirname(dirname(fileURLToPath(import.meta.url)))
	preparing = new Promise<void>((resolve, reject) => {
		log.info(`[runtime-provisioner] preparing first-use runtime at ${root}`)
		const child = spawn(bunExecutable(), ['scripts/setup.ts'], {
			cwd: appRoot,
			stdio: ['ignore', 'pipe', 'pipe'],
			env: { ...process.env, SUPERHIVE_RUNTIME_DIR: root },
		})
		let output = ''
		const collect = (chunk: Buffer) => {
			output = (output + chunk.toString('utf8')).slice(-8_000)
		}
		child.stdout?.on('data', collect)
		child.stderr?.on('data', collect)
		child.once('error', reject)
		child.once('exit', (code) => {
			if (code === 0 && isRuntimePrepared(root)) {
				log.info(`[runtime-provisioner] ready: ${root}`)
				resolve()
				return
			}
			reject(new Error(`Unable to prepare the Pi runtime. ${output.trim() || `setup exited with code ${code}`}`))
		})
	}).finally(() => {
		preparing = null
	})
	return preparing
}
