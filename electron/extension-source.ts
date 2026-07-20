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

import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import log from 'electron-log/main'

export const EXTENSIONS_DIR = join(homedir(), '.superhive', 'extensions')

export type ExtensionSource =
	| { kind: 'git'; url: string }
	| { kind: 'local'; path: string }

/**
 * Ensure an extension is present at its canonical location.
 * Idempotent: if the canonical dir exists and contains the sentinel file,
 * the existing clone is reused. Otherwise populated from `source`:
 *   - `{ kind: 'git', url }` → `git clone <url> <dir>`
 *   - `{ kind: 'local', path }` → copy directory contents from `path`
 *
 * @returns absolute path to the canonical extension directory.
 */
export function ensureExtension(name: string, source: ExtensionSource, sentinel = 'index.ts'): string {
	const dir = join(EXTENSIONS_DIR, name)
	if (existsSync(join(dir, sentinel))) {
		return dir
	}

	mkdirSync(EXTENSIONS_DIR, { recursive: true })

	if (source.kind === 'git') {
		log.info(`[extension-source] ${name} missing, cloning from ${source.url}...`)
		try {
			execFileSync('git', ['clone', source.url, dir], { stdio: 'pipe' })
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err)
			log.error(`[extension-source] git clone failed for ${name}: ${msg}`)
			throw new Error(
				`Failed to clone extension "${name}" from ${source.url}.\n` +
				`Check your network connection and try again.`,
			)
		}
	} else {
		log.info(`[extension-source] ${name} missing, copying from ${source.path}...`)
		if (!existsSync(join(source.path, sentinel))) {
			log.error(`[extension-source] local source missing sentinel ${sentinel} at ${source.path}`)
			throw new Error(
				`Local extension "${name}" not found at ${source.path} (missing ${sentinel}).`,
			)
		}
		try {
			cpSync(source.path, dir, { recursive: true })
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err)
			log.error(`[extension-source] copy failed for ${name}: ${msg}`)
			throw new Error(`Failed to copy extension "${name}" from ${source.path}.`)
		}
	}

	if (!existsSync(join(dir, sentinel))) {
		log.error(`[extension-source] source consumed but ${sentinel} is missing — repo may be empty or corrupted`)
		throw new Error(
			`Extension "${name}" source consumed but ${sentinel} is missing.\n` +
			`The extension source may be empty or corrupted.`,
		)
	}

	log.info(`[extension-source] ${name} ready at ${dir}`)
	return dir
}

/**
 * Return the canonical path for an extension. Does NOT populate — assumes
 * `ensureExtension()` was called first.
 */
export function getExtensionPath(name: string): string {
	return join(EXTENSIONS_DIR, name)
}
