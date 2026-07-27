/**
 * Canonical extension source for Superhive.
 *
 * Runtime extension sources are prepared once by `bun run setup` and copied
 * into each agent's `extensions/` folder. Runtime code never clones or
 * installs an extension.
 *
 * Legacy callers may still use `ensureExtension` for local development sources.
 */

import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import log from 'electron-log/main'

export const EXTENSIONS_DIR = join(homedir(), '.superhive', 'extensions')

export type ExtensionSource =
	| { kind: 'git'; url: string }
	| { kind: 'local'; path: string }

/**
 * Ensure an extension is present at the legacy canonical location.
 * New agent creation uses `agent-assets.ts` directly; this helper remains
 * for older callers but intentionally rejects remote sources.
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
		throw new Error(
			`Remote extension source rejected for "${name}". ` +
			`Run "bun run setup" to prepare the pinned local extension bundle.`,
		)
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
