/**
 * Install-time bootstrap for marketplace templates.
 *
 * Copies every bundled `resources/templates/*.json` into the user's
 * Superhive home at `~/.superhive/templates/<id>.json`.
 *
 * Idempotent: per-file check. If `<id>.json` already exists in the
 * user's templates folder, we leave it alone — the user may have
 * edited it (added a skill, changed a permission profile). Their
 * version wins. We never overwrite a user-edited file.
 *
 * Resolution order for the bundled source dir:
 *   1. `<resourcesPath>/templates/`  (production)
 *   2. `<SUPERHIVE_RESOURCES_PATH>/templates/`  (env override)
 *   3. `<cwd>/resources/templates/`  (dev, running from superhive/)
 *
 * Exposes `getTemplatesDir()` and `getTemplatesSourceDir()` for the
 * templates:list / templates:get IPC handlers (Phase F) and the
 * spawn ext's template renderer (Phase E).
 */

import { existsSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs'
import { join } from 'node:path'
import { SUPERHIVE_HOME } from './install-project-agent-defaults'
import log from 'electron-log/main'

export const TEMPLATES_DIR_NAME = 'templates'
export const USER_TEMPLATES_DIR = join(SUPERHIVE_HOME, TEMPLATES_DIR_NAME)

export function resolveTemplatesSourceDir(): string {
	const candidates: Array<{ path: string; source: string }> = []

	if (process.resourcesPath) {
		candidates.push({
			path: join(process.resourcesPath, TEMPLATES_DIR_NAME),
			source: `process.resourcesPath (${process.resourcesPath})`,
		})
	}

	if (process.env.SUPERHIVE_RESOURCES_PATH) {
		candidates.push({
			path: join(process.env.SUPERHIVE_RESOURCES_PATH, TEMPLATES_DIR_NAME),
			source: `SUPERHIVE_RESOURCES_PATH (${process.env.SUPERHIVE_RESOURCES_PATH})`,
		})
	}

	candidates.push({
		path: join(process.cwd(), 'resources', TEMPLATES_DIR_NAME),
		source: `cwd fallback (${process.cwd()}/resources/)`,
	})

	for (const candidate of candidates) {
		if (existsSync(candidate.path)) {
			return candidate.path
		}
	}

	throw new Error(
		`templates directory not found.\n` +
			`Checked:\n${candidates
				.map((c) => `  - ${c.source}: ${c.path}`)
				.join('\n')}\n` +
			`Ensure the app was built with extraResources including the resources/ folder.`,
	)
}

export interface InstallTemplatesResult {
	copied: number
	skipped: number
	sourceDir: string
	destinationDir: string
}

/**
 * Ensure every bundled template exists at `~/.superhive/templates/<id>.json`.
 * Per-file idempotency: existing files are left alone.
 *
 * Safe to call at every app startup. Idempotent. No I/O if every
 * file already exists.
 */
export function installTemplates(): InstallTemplatesResult {
	const sourceDir = resolveTemplatesSourceDir()
	const destinationDir = USER_TEMPLATES_DIR

	mkdirSync(destinationDir, { recursive: true })

	let copied = 0
	let skipped = 0

	const entries = readdirSync(sourceDir).filter((name) => name.endsWith('.json'))
	for (const entry of entries) {
		const sourceFile = join(sourceDir, entry)
		const destinationFile = join(destinationDir, entry)

		if (existsSync(destinationFile)) {
			skipped += 1
			continue
		}

		copyFileSync(sourceFile, destinationFile)
		copied += 1
	}

	log.info(
		`[install-templates] copied=${copied} skipped=${skipped} (${sourceDir} → ${destinationDir})`,
	)

	return {
		copied,
		skipped,
		sourceDir,
		destinationDir,
	}
}

export function getTemplatesDir(): string {
	return USER_TEMPLATES_DIR
}
