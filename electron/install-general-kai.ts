/** Validate the prepared general-kai/Pi runtime used by every agent. */

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { resolveGeneralKaiDir } from './runtime-paths'

export function isGeneralKaiReady(): boolean {
	return existsSync(join(getGeneralKaiDir(), 'pi', 'packages', 'coding-agent', 'dist', 'cli.js'))
}

export function getGeneralKaiDir(): string {
	return resolveGeneralKaiDir()
}

export function ensureGeneralKai(): void {
	if (isGeneralKaiReady()) return
	throw new Error(
		`The prepared Pi runtime is missing at ${getGeneralKaiDir()}.`,
	)
}
