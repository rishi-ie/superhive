/**
 * Install-time bootstrap for project-agent defaults.
 *
 * Copies the bundled `project-agent-defaults.json` from the app's
 * resources directory into the user's Superhive home:
 *
 *   ~/.superhive/project-agent-defaults.json
 *
 * Idempotent: if the destination file already exists, we leave it
 * alone. The user may have edited it (added an overlay, tweaked a
 * fragment); their version wins. We never overwrite a user file.
 *
 * Resolution order for the bundled source:
 *   1. `process.resourcesPath/project-agent-defaults.json`  (production)
 *   2. `${SUPERHIVE_RESOURCES_PATH}/project-agent-defaults.json`  (env override)
 *   3. `<cwd>/resources/project-agent-defaults.json`  (dev, running from superhive/)
 *
 * The dev fallback lets `bun run electron:preview` (or `vite`)
 * resolve the file from the `superhive/resources/` directory we ship
 * in the repo, without a packaged build.
 */

import { existsSync, mkdirSync, copyFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import log from 'electron-log/main'

export const SUPERHIVE_HOME = join(homedir(), '.superhive')
export const DEFAULTS_FILE_NAME = 'project-agent-defaults.json'
export const USER_DEFAULTS_PATH = join(SUPERHIVE_HOME, DEFAULTS_FILE_NAME)

/**
 * Resolve the bundled source path. Returns the absolute path to a
 * real file or throws. See header for the resolution order.
 */
export function resolveProjectAgentDefaultsSource(): string {
	const candidates: Array<{ path: string; source: string }> = []

	if (process.resourcesPath) {
		candidates.push({
			path: join(process.resourcesPath, DEFAULTS_FILE_NAME),
			source: `process.resourcesPath (${process.resourcesPath})`,
		})
	}

	if (process.env.SUPERHIVE_RESOURCES_PATH) {
		candidates.push({
			path: join(process.env.SUPERHIVE_RESOURCES_PATH, DEFAULTS_FILE_NAME),
			source: `SUPERHIVE_RESOURCES_PATH (${process.env.SUPERHIVE_RESOURCES_PATH})`,
		})
	}

	candidates.push({
		path: join(process.cwd(), 'resources', DEFAULTS_FILE_NAME),
		source: `cwd fallback (${process.cwd()}/resources/)`,
	})

	for (const candidate of candidates) {
		if (existsSync(candidate.path)) {
			return candidate.path
		}
	}

	throw new Error(
		`project-agent-defaults.json not found.\n` +
			`Checked:\n${candidates
				.map((c) => `  - ${c.source}: ${c.path}`)
				.join('\n')}\n` +
			`Ensure the app was built with extraResources including the resources/ folder.`,
	)
}

export interface InstallDefaultsResult {
	copied: boolean
	sourcePath: string
	destinationPath: string
	reason: 'missing' | 'user-edited-wins' | 'copied'
}

/**
 * Ensure `~/.superhive/project-agent-defaults.json` exists. Copies
 * the bundled source if missing; leaves the user's version alone if
 * present.
 *
 * Safe to call at every app startup. Idempotent. No I/O if the file
 * already exists.
 */
export function installProjectAgentDefaults(): InstallDefaultsResult {
	const sourcePath = resolveProjectAgentDefaultsSource()
	const destinationPath = USER_DEFAULTS_PATH

	if (existsSync(destinationPath)) {
		log.info(`[install-project-agent-defaults] user-edited file wins, skipping copy`)
		return {
			copied: false,
			sourcePath,
			destinationPath,
			reason: 'user-edited-wins',
		}
	}

	mkdirSync(SUPERHIVE_HOME, { recursive: true })
	copyFileSync(sourcePath, destinationPath)

	const stats = statSync(destinationPath)
	log.info(
		`[install-project-agent-defaults] copied ${sourcePath} → ${destinationPath} (${stats.size} bytes)`,
	)

	return {
		copied: true,
		sourcePath,
		destinationPath,
		reason: 'missing',
	}
}

export function getProjectAgentDefaultsPath(): string {
	return USER_DEFAULTS_PATH
}
