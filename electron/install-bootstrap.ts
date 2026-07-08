/**
 * Install-time bootstrap for the manifest-pi template.
 *
 * Auto-clones from https://github.com/rishi-ie/manifest-pi.git on first agent
 * creation if the template is not yet present. No manual setup required.
 *
 * Use `isManifestPiTemplateReady()` to check at app startup.
 * The runtime uses `TEMPLATE_DIR` as the shared manifest-pi source for all agents.
 */

import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { execFileSync } from 'node:child_process'
import log from 'electron-log/main'

export const TEMPLATE_DIR = join(homedir(), '.superhive', 'manifest-pi-template')
const TEMPLATE_URL = 'https://github.com/rishi-ie/manifest-pi.git'

export function isManifestPiTemplateReady(): boolean {
	return existsSync(join(TEMPLATE_DIR, 'agent.sh'))
}

export function getManifestPiTemplateDir(): string {
	return TEMPLATE_DIR
}

export function ensureManifestPiTemplate(): void {
	if (isManifestPiTemplateReady()) return

	log.info('[install-bootstrap] manifest-pi template missing, cloning from GitHub...')
	mkdirSync(join(homedir(), '.superhive'), { recursive: true })

	try {
		execFileSync('git', ['clone', TEMPLATE_URL, TEMPLATE_DIR], { stdio: 'pipe' })
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err)
		log.error(`[install-bootstrap] git clone failed: ${msg}`)
		throw new Error(
			`Failed to clone manifest-pi template from ${TEMPLATE_URL}.\n` +
			`Check your network connection and try again.`,
		)
	}

	if (!isManifestPiTemplateReady()) {
		log.error('[install-bootstrap] clone succeeded but agent.sh is missing — template may be corrupted')
		throw new Error(
			`manifest-pi template clone succeeded but agent.sh is missing.\n` +
			`The template repository may be empty or corrupted.`,
		)
	}

	log.info('[install-bootstrap] manifest-pi template ready')
}
