/** Validate the prepared general-kai/Pi runtime used by every agent. */

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { resolveGeneralKaiDir } from './runtime-paths'

export const GENERAL_KAI_DIR = resolveGeneralKaiDir()

export function isGeneralKaiReady(): boolean {
	return existsSync(join(GENERAL_KAI_DIR, 'pi', 'packages', 'coding-agent', 'dist', 'cli.js'))
}

export function getGeneralKaiDir(): string {
	return GENERAL_KAI_DIR
}

export function ensureGeneralKai(): void {
	if (isGeneralKaiReady()) return
	throw new Error(
		`The prepared Pi runtime is missing at ${GENERAL_KAI_DIR}. ` +
		`Run "bun run setup" from the Superhive directory before creating an agent.`,
	)
}
