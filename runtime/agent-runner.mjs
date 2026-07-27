import { existsSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const agentDir = resolve(process.env.AGENT_DIR ?? dirname(fileURLToPath(import.meta.url)))
const piDir = resolve(process.env.PI_DIR ?? join(agentDir, 'pi'))
const piEntry = join(piDir, 'packages', 'coding-agent', 'dist', 'cli.js')
const manifest = join(agentDir, 'manifest.json')
const folderName = agentDir.split(/[\\/]/).pop() || 'agent'
const settings = join(agentDir, `Superhive-pi-${folderName}.json`)

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
		extensions: ['./extensions/superhive-pi-truth', './extensions/superhive-pi-telemetry'],
	}, null, 2) + '\n')
}

const activeManifest = existsSync(settings) ? settings : manifest
const nodeBin = process.env.PI_NODE || process.env.NODE || 'node'
const child = spawn(nodeBin, [piEntry, '--manifest', activeManifest, ...process.argv.slice(2)], {
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
