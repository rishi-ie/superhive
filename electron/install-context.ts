/**
 * Local-bundle resolver for superhive-pi-context.
 *
 * Unlike superhive-pi-truth and superhive-pi-telemetry (which clone from GitHub),
 * superhive-pi-context is shipped inside the Superhive repo or as a bundled
 * extraResources entry. This resolver returns the absolute path to use as the
 * extension source.
 *
 * Resolution order:
 *   1. <cwd>/superhive-pi-context           (dev: monorepo checkout)
 *   2. <resourcesPath>/extensions/superhive-pi-context   (production bundle)
 *
 * No GitHub clone. No network call. If neither path exists, throws — the
 * coordinator agent creation flow must catch and surface the error.
 */

import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

const SENTINEL = 'index.ts'
const DEV_PATH = resolve(process.cwd(), 'superhive-pi-context')

export function resolveContextExtensionPath(resourcesPath?: string): string {
	if (existsSync(join(DEV_PATH, SENTINEL))) {
		return DEV_PATH
	}
	const bundled = join(resourcesPath ?? process.env.SUPERHIVE_RESOURCES_PATH ?? '', 'extensions', 'superhive-pi-context')
	if (existsSync(join(bundled, SENTINEL))) {
		return bundled
	}
	throw new Error(
		`superhive-pi-context not found.\n` +
		`Checked dev path: ${DEV_PATH}\n` +
		`Checked bundled path: ${bundled}\n` +
		`Ensure the extension source is available (dev checkout or bundled in extraResources).`,
	)
}
