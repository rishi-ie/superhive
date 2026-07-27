import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { resolveLauncherPath } from './runtime-paths'
import { writeAgentRuntimeReference } from './agent-runtime-reference'

/** Copies user-managed marketplace assets only; core extensions use runtime references. */
export function copyTree(source: string, destination: string): void {
	if (!existsSync(source)) throw new Error(`Asset source does not exist: ${source}`)
	mkdirSync(destination, { recursive: true })
	for (const entry of readdirSync(source)) {
		if (entry === '.git' || entry === 'node_modules' || entry === '.DS_Store') continue
		const from = join(source, entry)
		const to = join(destination, entry)
		if (statSync(from).isDirectory()) copyTree(from, to)
		else cpSync(from, to)
	}
}

export function installAgentLaunchers(agentDir: string): void {
	for (const name of ['agent-runner.mjs', 'agent.sh', 'agent.cmd', 'agent.ps1']) {
		const source = resolveLauncherPath(name)
		cpSync(source, join(agentDir, name))
	}
	writeAgentRuntimeReference(agentDir)
}

export function installManifestAlias(agentDir: string): void {
	const manifest = join(agentDir, 'manifest.json')
	if (existsSync(manifest)) cpSync(manifest, join(agentDir, 'agent.json'))
}
