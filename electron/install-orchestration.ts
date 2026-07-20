/**
 * Local-bundle resolver for superhive-pi-orchestration.
 *
 * Mirrors `install-context.ts`. Unlike superhive-pi-truth and superhive-pi-telemetry
 * (which clone from GitHub), superhive-pi-orchestration is shipped alongside
 * the Superhive repo or as a bundled extraResources entry. This resolver
 * returns the absolute path to use as the extension source.
 *
 * Resolution order:
 *   1. SUPERHIVE_PI_ORCHESTRATION_PATH env var (explicit override)
 *   2. Walk up from cwd looking for `superhive-pi-orchestration` with `index.ts`
 *   3. <resourcesPath>/extensions/superhive-pi-orchestration   (production bundle)
 *
 * No GitHub clone. No network call. If none of the above resolve, throws —
 * the coordinator agent creation flow must catch and surface the error.
 *
 * Dev convention: the canonical location is the workspace root
 * `superhive-pi-orchestration/` (sibling to `superhive/`). Electron runs from
 * `superhive/`, so the walk-up search resolves `<workspace>/superhive-pi-orchestration`.
 * A `superhive/superhive-pi-orchestration` symlink is also accepted for layouts
 * where the extension lives inside the app dir (matches electron-builder.yml).
 */

import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const SENTINEL = 'index.ts'

function hasSentinel(dir: string): boolean {
	return existsSync(join(dir, SENTINEL))
}

function walkUp(start: string, target: string): string | null {
	let dir = resolve(start)
	const root = resolve(dirname(dir))
	while (dir !== root) {
		const candidate = join(dir, target)
		if (hasSentinel(candidate)) return candidate
		const parent = dirname(dir)
		if (parent === dir) return null
		dir = parent
	}
	const rootCandidate = join(dir, target)
	if (hasSentinel(rootCandidate)) return rootCandidate
	return null
}

export function resolveOrchestrationExtensionPath(resourcesPath?: string): string {
	const override = process.env.SUPERHIVE_PI_ORCHESTRATION_PATH
	if (override && hasSentinel(override)) {
		return resolve(override)
	}

	const found = walkUp(process.cwd(), 'superhive-pi-orchestration')
	if (found) return found

	const bundled = join(
		resourcesPath ?? process.env.SUPERHIVE_RESOURCES_PATH ?? '',
		'extensions',
		'superhive-pi-orchestration',
	)
	if (hasSentinel(bundled)) return bundled

	throw new Error(
		`superhive-pi-orchestration not found.\n` +
			`Checked env override (SUPERHIVE_PI_ORCHESTRATION_PATH): ${override ?? '(unset)'}\n` +
			`Checked walk-up from cwd (${process.cwd()}): no matching dir\n` +
			`Checked bundled path: ${bundled}\n` +
			`Ensure the extension source is available (dev checkout at workspace root, ` +
			`symlink at superhive/superhive-pi-orchestration, or bundled in extraResources).`,
	)
}