/**
 * Canonical extension source for Superhive.
 *
 * Extensions are no longer bundled with the app. At runtime, each extension
 * is cloned ONCE to a canonical location (`~/.superhive/extensions/<name>/`)
 * and symlinked into each agent's `extensions/` folder.
 *
 * Usage:
 *   const path = ensureExtension('superhive-pi-truth', 'https://github.com/rishi-ie/superhive-pi-truth.git')
 *   // → ~/.superhive/extensions/superhive-pi-truth  (cloned if missing)
 */

import { existsSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import log from 'electron-log/main'

export const EXTENSIONS_DIR = join(homedir(), '.superhive', 'extensions')

/**
 * Ensure an extension is cloned to its canonical location.
 * Idempotent: if the canonical dir exists and contains the sentinel file,
 * the existing clone is reused. Otherwise, `git clone` from `repoUrl`.
 *
 * @returns absolute path to the canonical extension directory.
 */
export function ensureExtension(name: string, repoUrl: string, sentinel = 'index.ts'): string {
	const dir = join(EXTENSIONS_DIR, name)
	if (existsSync(join(dir, sentinel))) {
		return dir
	}

	log.info(`[extension-source] ${name} missing, cloning from ${repoUrl}...`)
	mkdirSync(EXTENSIONS_DIR, { recursive: true })

	try {
		execFileSync('git', ['clone', repoUrl, dir], { stdio: 'pipe' })
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err)
		log.error(`[extension-source] git clone failed for ${name}: ${msg}`)
		throw new Error(
			`Failed to clone extension "${name}" from ${repoUrl}.\n` +
			`Check your network connection and try again.`,
		)
	}

	if (!existsSync(join(dir, sentinel))) {
		log.error(`[extension-source] clone succeeded but ${sentinel} is missing — repo may be empty or corrupted`)
		throw new Error(
			`Extension "${name}" clone succeeded but ${sentinel} is missing.\n` +
			`The extension repository may be empty or corrupted.`,
		)
	}

	log.info(`[extension-source] ${name} ready at ${dir}`)
	return dir
}

/**
 * Return the canonical path for an extension. Does NOT clone — assumes
 * `ensureExtension()` was called first.
 */
export function getExtensionPath(name: string): string {
	return join(EXTENSIONS_DIR, name)
}
