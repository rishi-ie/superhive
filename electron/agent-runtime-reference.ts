import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { runtimeRoot } from './runtime-paths'

export const AGENT_RUNTIME_REFERENCE_FILE = 'superhive-runtime.json'

export interface AgentRuntimeReference {
	version: 1
	runtimeRoot: string
}

export function writeAgentRuntimeReference(agentDir: string): void {
	const reference: AgentRuntimeReference = { version: 1, runtimeRoot: runtimeRoot() }
	writeFileSync(join(agentDir, AGENT_RUNTIME_REFERENCE_FILE), JSON.stringify(reference, null, 2) + '\n')
}
