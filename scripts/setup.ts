import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, resolve } from 'node:path'
import {
	applyRuntimeCompatibility,
	RUNTIME_COMPATIBILITY_VERSION,
	runtimeAssetNeedsRefresh,
} from './runtime-compatibility'
import { loadRuntimeBundleManifest } from '../electron/runtime-bundle-manifest'

const root = resolve(import.meta.dir, '..')
const runtimeRoot = process.env.SUPERHIVE_RUNTIME_DIR
	? resolve(process.env.SUPERHIVE_RUNTIME_DIR)
	: join(root, '.runtime')
const runtimeManifest = loadRuntimeBundleManifest()
const generalKaiRef = runtimeManifest.generalKai.ref
const extensionSpecs = Object.entries(runtimeManifest.extensions).map(([name, ref]) => [
	name,
	`https://github.com/rishi-ie/${name}.git`,
	ref,
] as const)
const preparedRuntimeManifest = (() => {
	try {
		return JSON.parse(readFileSync(join(runtimeRoot, 'runtime-manifest.json'), 'utf8')) as {
			generalKaiRef?: string
			extensions?: Record<string, string>
		}
	} catch {
		return {}
	}
})()

function command(name: string, args: string[], cwd?: string): string {
	try {
		return execFileSync(name, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
	} catch (error) {
		const detail = error instanceof Error ? error.message : String(error)
		const installHint = name === 'git'
			? process.platform === 'win32' ? 'Install Git for Windows: https://git-scm.com/download/win'
				: process.platform === 'darwin' ? 'Install Git with Xcode Command Line Tools: xcode-select --install'
					: 'Install Git with your distribution package manager, for example: sudo apt-get install git'
			: name === 'node' || (name.startsWith('npm') && ['--version', 'install', 'ci'].includes(args[0] ?? '')) ? 'Install Node.js 22.19+ from https://nodejs.org/'
				: name === 'bun' ? 'Install Bun 1.3+ from https://bun.sh/'
					: undefined
		throw new Error(`Command failed: ${name} ${args.join(' ')}\n${detail}${installHint ? `\n${installHint}` : ''}`)
	}
}

function requireVersion(name: string, actual: string, minimum: [number, number, number]): void {
	const match = actual.match(/(\d+)\.(\d+)\.(\d+)/)
	const version = match ? match.slice(1, 4).map(Number) : [0, 0, 0]
	const ok = version[0] > minimum[0] ||
		(version[0] === minimum[0] && version[1] > minimum[1]) ||
		(version[0] === minimum[0] && version[1] === minimum[1] && version[2] >= minimum[2])
	if (!ok) throw new Error(`${name} ${minimum.join('.')}+ is required; found ${actual.trim()}`)
}

function copyTree(source: string, destination: string): void {
	if (!existsSync(source)) throw new Error(`Missing runtime asset: ${source}`)
	mkdirSync(destination, { recursive: true })
	for (const entry of readdirSync(source)) {
		if (entry === '.git' || entry === 'node_modules' || entry === 'test' || entry === 'tests' || entry === '.DS_Store') continue
		const from = join(source, entry)
		const to = join(destination, entry)
		if (statSync(from).isDirectory()) copyTree(from, to)
		else cpSync(from, to)
	}
}

function validateResources(): void {
	const requiredFiles = [
		'resources/agent-profiles/general-worker.json',
		'resources/marketplace/catalog.json',
		'resources/runtime/manifest.json',
	]
	for (const relative of requiredFiles) {
		if (!existsSync(join(root, relative))) throw new Error(`Required bundled resource is missing: ${relative}`)
	}
	for (const relative of ['resources/templates', 'resources/skills', 'resources/composer-commands']) {
		const directory = join(root, relative)
		if (!existsSync(directory) || readdirSync(directory).length === 0) {
			throw new Error(`Required bundled resource directory is missing or empty: ${relative}`)
		}
	}
}

function localCandidate(name: string): string | null {
	const candidates = [
		process.env[`SUPERHIVE_${name.replaceAll('-', '_').toUpperCase()}_PATH`],
		join(root, '..', name),
		join(root, '..', 'general-kai', 'extensions', name),
	]
	return candidates.find((candidate): candidate is string => Boolean(candidate) && existsSync(join(candidate, 'index.ts'))) ?? null
}

function cloneAt(name: string, url: string, ref: string, destination: string): void {
	if (!existsSync(join(destination, 'index.ts'))) {
		mkdirSync(resolve(destination, '..'), { recursive: true })
		command('git', ['clone', '--filter=blob:none', url, destination])
	}
	command('git', ['fetch', '--depth=1', 'origin', ref], destination)
	command('git', ['checkout', '--detach', ref], destination)
}

function prepareGeneralKai(): string {
	const local = process.env.SUPERHIVE_GENERAL_KAI_PATH
	const sibling = join(root, '..', 'general-kai')
	const source = local && existsSync(join(local, 'pi', 'package.json'))
		? resolve(local)
		: existsSync(join(sibling, 'pi', 'package.json'))
			? sibling
			: null
	const destination = join(runtimeRoot, 'general-kai')
	const refresh = runtimeAssetNeedsRefresh(
		preparedRuntimeManifest.generalKaiRef,
		generalKaiRef,
		process.env.SUPERHIVE_REFRESH_RUNTIME === '1',
	)
	const runtimeReady = existsSync(join(destination, 'pi', 'packages', 'coding-agent', 'dist', 'cli.js'))
	if (source && resolve(source) !== resolve(destination) && (!runtimeReady || refresh)) {
		rmSync(destination, { recursive: true, force: true })
		copyTree(source, destination)
	}
	if (!source && refresh) {
		rmSync(destination, { recursive: true, force: true })
	}
	if (!existsSync(join(destination, 'pi', 'package.json'))) {
		mkdirSync(runtimeRoot, { recursive: true })
		cloneAt('general-kai', 'https://github.com/rishi-ie/general-kai.git', generalKaiRef, destination)
	}
	const piDir = join(destination, 'pi')
	if (!existsSync(join(piDir, 'node_modules')) || !existsSync(join(piDir, 'packages', 'coding-agent', 'dist', 'cli.js'))) {
		const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
		console.log('[setup] Installing and compiling the pinned Pi runtime once...')
		const lockfile = existsSync(join(piDir, 'package-lock.json'))
		command(npm, [lockfile ? 'ci' : 'install', '--ignore-scripts'], piDir)
		const node = process.env.NODE ?? (process.platform === 'win32' ? 'node.exe' : 'node')
		const tsgo = join(piDir, 'node_modules', '@typescript', 'native-preview', 'bin', 'tsgo.js')
		if (!existsSync(tsgo)) throw new Error(`Pi compiler is missing at ${tsgo}; reinstall the pinned runtime dependencies.`)
		console.log('[setup] Compiling checked-in Pi catalogs without refreshing live provider metadata...')
		for (const packageName of ['tui', 'ai', 'agent', 'coding-agent', 'orchestrator']) {
			command(node, [tsgo, '-p', 'tsconfig.build.json'], join(piDir, 'packages', packageName))
		}
	}
	return destination
}

function prepareExtensions(generalKaiDir: string): void {
	const destinationRoot = join(runtimeRoot, 'extensions')
	for (const [name, url, ref] of extensionSpecs) {
		const destination = join(destinationRoot, name)
		const local = localCandidate(name) ?? join(generalKaiDir, 'extensions', name)
		const refresh = runtimeAssetNeedsRefresh(
			preparedRuntimeManifest.extensions?.[name],
			ref,
			process.env.SUPERHIVE_REFRESH_RUNTIME === '1',
		)
		if (existsSync(join(destination, 'index.ts')) && !refresh) {
			console.log(`[setup] ${name} already prepared`)
			continue
		}
		if (existsSync(join(local, 'index.ts'))) {
			rmSync(destination, { recursive: true, force: true })
			copyTree(local, destination)
			console.log(`[setup] prepared ${name} from local source`)
		} else {
			rmSync(destination, { recursive: true, force: true })
			cloneAt(name, url, ref, destination)
			console.log(`[setup] prepared ${name} from pinned source`)
		}
	}
}

try {
	requireVersion('Node.js', process.version, [22, 19, 0])
	requireVersion('Bun', command('bun', ['--version']), [1, 3, 0])
	command('git', ['--version'])
	validateResources()
	const generalKaiDir = prepareGeneralKai()
	prepareExtensions(generalKaiDir)
	applyRuntimeCompatibility(runtimeRoot)
	mkdirSync(runtimeRoot, { recursive: true })
	writeFileSync(join(runtimeRoot, 'runtime-manifest.json'), JSON.stringify({
		version: RUNTIME_COMPATIBILITY_VERSION,	generalKaiRef,
		generalKaiDir,
		extensions: Object.fromEntries(extensionSpecs.map(([name, , ref]) => [name, ref])),
		preparedAt: new Date().toISOString(),
	}, null, 2) + '\n')
	console.log(`[setup] ready: ${runtimeRoot}`)
} catch (error) {
	const message = error instanceof Error ? error.message : String(error)
	console.error(`[setup] failed: ${message}`)
	if (/ENOTFOUND|fetch failed|network|ECONN|timed out/i.test(message)) {
		console.error('[setup] The pinned runtime build needs outbound HTTPS access to download dependencies and refresh its model catalog.')
		console.error('[setup] Check Git/network access, then retry "bun run setup".')
	} else {
		console.error('[setup] Check the dependency named above, then retry "bun run setup".')
	}
	process.exitCode = 1
}
