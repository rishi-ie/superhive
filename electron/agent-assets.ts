import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { resolveExtensionPath, resolveLauncherPath } from './runtime-paths'

function ignored(path: string): boolean {
	return /[\\/](?:\.git|node_modules|test|tests)(?:[\\/]|$)/.test(path) || path.endsWith('.DS_Store')
}

export function copyTree(source: string, destination: string): void {
	if (!existsSync(source)) throw new Error(`Asset source does not exist: ${source}`)
	mkdirSync(destination, { recursive: true })
	for (const entry of readdirSync(source)) {
		const sourcePath = join(source, entry)
		if (ignored(sourcePath)) continue
		const destinationPath = join(destination, entry)
		if (statSync(sourcePath).isDirectory()) copyTree(sourcePath, destinationPath)
		else cpSync(sourcePath, destinationPath)
	}
}

export function installAgentLaunchers(agentDir: string): void {
	for (const name of ['agent-runner.mjs', 'agent.sh', 'agent.cmd', 'agent.ps1']) {
		const source = resolveLauncherPath(name)
		cpSync(source, join(agentDir, name))
	}
}

export function installAgentExtension(agentDir: string, name: string, resourcesPath?: string): void {
	const source = resolveExtensionPath(name, resourcesPath)
	copyTree(source, join(agentDir, 'extensions', name))
}

export function installManifestAlias(agentDir: string): void {
	const manifest = join(agentDir, 'manifest.json')
	if (existsSync(manifest)) cpSync(manifest, join(agentDir, 'agent.json'))
}

export function installBundledExtension(source: string, destination: string): void {
	copyTree(source, destination)
}
