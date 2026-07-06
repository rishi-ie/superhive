/**
 * Install-time bootstrap for the manifest-pi template.
 *
 * Does NOT auto-clone. The template must be pre-installed via:
 *   bun run install:pi
 *
 * Use `isManifestPiTemplateReady()` to check at app startup.
 * The runtime uses `TEMPLATE_DIR` as the shared manifest-pi source for all agents.
 */

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

export const TEMPLATE_DIR = join(homedir(), '.superhive', 'manifest-pi-template')

export function isManifestPiTemplateReady(): boolean {
	return existsSync(join(TEMPLATE_DIR, 'agent.sh'))
}

export function getManifestPiTemplateDir(): string {
	return TEMPLATE_DIR
}

export function assertManifestPiTemplateReady(): void {
	if (!isManifestPiTemplateReady()) {
		throw new Error(
			`manifest-pi template missing at ${TEMPLATE_DIR}.\n` +
			`Run \`bun run install:pi\` to install it.`,
		)
	}
}
