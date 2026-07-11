/**
 * Install-time bootstrap for the general-kai template.
 *
 * Auto-clones from https://github.com/rishi-ie/general-kai.git on first agent
 * creation if the template is not yet present. No manual setup required.
 *
 * Use `isGeneralKaiReady()` to check at app startup.
 * The runtime uses `GENERAL_KAI_DIR` as the shared template source for all agents.
 */

import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { execFileSync } from 'node:child_process'
import log from 'electron-log/main'

export const GENERAL_KAI_DIR = join(homedir(), '.superhive', 'general-kai-template')
const GENERAL_KAI_URL = 'https://github.com/rishi-ie/general-kai.git'

export function isGeneralKaiReady(): boolean {
	return existsSync(join(GENERAL_KAI_DIR, 'agent.sh'))
}

export function getGeneralKaiDir(): string {
	return GENERAL_KAI_DIR
}

export function ensureGeneralKai(): void {
	if (isGeneralKaiReady()) return

	log.info('[install-general-kai] template missing, cloning from GitHub...')
	mkdirSync(join(homedir(), '.superhive'), { recursive: true })

	try {
		execFileSync('git', ['clone', GENERAL_KAI_URL, GENERAL_KAI_DIR], { stdio: 'pipe' })
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err)
		log.error(`[install-general-kai] git clone failed: ${msg}`)
		throw new Error(
			`Failed to clone general-kai template from ${GENERAL_KAI_URL}.\n` +
			`Check your network connection and try again.`,
		)
	}

	if (!isGeneralKaiReady()) {
		log.error('[install-general-kai] clone succeeded but agent.sh is missing — template may be corrupted')
		throw new Error(
			`general-kai template clone succeeded but agent.sh is missing.\n` +
			`The template repository may be empty or corrupted.`,
		)
	}

	log.info('[install-general-kai] template ready')
}
