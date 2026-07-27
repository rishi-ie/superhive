import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const agentDir = resolve(process.env.AGENT_DIR ?? dirname(fileURLToPath(import.meta.url)))
const runtimeReference = join(agentDir, 'superhive-runtime.json')
let referencedRuntime
try {
	const parsed = JSON.parse(readFileSync(runtimeReference, 'utf8'))
	if (parsed?.version === 1 && typeof parsed.runtimeRoot === 'string') referencedRuntime = parsed.runtimeRoot
} catch {}
const piDir = resolve(process.env.PI_DIR ?? (referencedRuntime ? join(referencedRuntime, 'general-kai', 'pi') : join(agentDir, 'pi')))
const piEntry = join(piDir, 'packages', 'coding-agent', 'dist', 'cli.js')
const manifest = join(agentDir, 'manifest.json')
const coreExtensionIds = new Set([
	'superhive-pi-truth', 'superhive-pi-telemetry', 'superhive-pi-context',
	'superhive-pi-orchestration', 'superhive-pi-plan', 'superhive-pi-spawn',
])

if (!existsSync(piEntry)) {
	console.error(`[agent-runner] Pi runtime is missing: ${piEntry}`)
	console.error('[agent-runner] Run "bun run setup" from the Superhive directory.')
	process.exit(1)
}

if (!existsSync(manifest)) {
	writeFileSync(manifest, JSON.stringify({
		superhiveId: process.env.AGENT_ID,
		version: 1,
		workspace: './workspace',
		extensions: referencedRuntime
			? ['superhive-pi-truth', 'superhive-pi-telemetry'].map((id) => join(referencedRuntime, 'extensions', id))
			: ['./extensions/superhive-pi-truth', './extensions/superhive-pi-telemetry'],
	}, null, 2) + '\n')
}

// Migrate only app-managed extension paths. User extensions stay relative to
// the agent folder and remain fully portable with that agent.
if (referencedRuntime) {
	try {
		const parsed = JSON.parse(readFileSync(manifest, 'utf8'))
		if (Array.isArray(parsed.extensions)) {
			const extensions = parsed.extensions.map((value) => {
				if (typeof value !== 'string') return value
				const id = value.replace(/^\.\/extensions\//, '')
				return coreExtensionIds.has(id) ? join(referencedRuntime, 'extensions', id) : value
			})
			if (JSON.stringify(extensions) !== JSON.stringify(parsed.extensions)) {
				writeFileSync(manifest, JSON.stringify({ ...parsed, extensions }, null, 2) + '\n')
			}
		}
	} catch (error) {
		console.error(`[agent-runner] invalid manifest: ${error.message}`)
		process.exit(1)
	}
}

const nodeBin = process.env.PI_NODE || process.env.NODE || 'node'
const child = spawn(nodeBin, [piEntry, '--manifest', manifest, ...process.argv.slice(2)], {
	cwd: agentDir,
	stdio: 'inherit',
	shell: false,
	env: { ...process.env, AGENT_DIR: agentDir, PI_AGENT_DIR: agentDir },
})

child.on('error', (error) => {
	console.error(`[agent-runner] unable to start Node (${nodeBin}): ${error.message}`)
	process.exitCode = 1
})
child.on('exit', (code, signal) => {
	process.exitCode = signal ? 1 : (code ?? 1)
})
