/**
 * Local-bundle resolver for superhive-pi-context.
 *
 * The extension is prepared by `bun run setup` and copied into each agent.
 *
 * Resolution order:
 *   1. SUPERHIVE_PI_CONTEXT_PATH env var (explicit override)
 *   2. <cwd>/.runtime/extensions/superhive-pi-context (dev bundle)
 *   3. Walk up from cwd looking for a local development source
 *   4. <resourcesPath>/runtime/extensions/superhive-pi-context (production)
 *
 * No GitHub clone. No network call. If none of the above resolve, throws —
 * the coordinator agent creation flow must catch and surface the error.
 *
 * The walk-up source is an explicit development fallback for multi-repo workspaces.
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

export function resolveContextExtensionPath(resourcesPath?: string): string {
	// 1. Explicit env var override.
	const override = process.env.SUPERHIVE_PI_CONTEXT_PATH
	if (override && hasSentinel(override)) {
		return resolve(override)
	}

	// 2. Prefer the prepared bundle so sibling checkouts cannot drift at runtime.
	const prepared = join(process.cwd(), '.runtime', 'extensions', 'superhive-pi-context')
	if (hasSentinel(prepared)) return prepared

	// 3. Walk up from cwd looking for a `superhive-pi-context` directory
	//    that contains `index.ts`. Handles both layouts:
	//      - cwd = workspace root → finds ./superhive-pi-context
	//      - cwd = superhive/ → finds ../superhive-pi-context
	//      - cwd = superhive/ with a local development folder → finds ./superhive-pi-context
	const found = walkUp(process.cwd(), 'superhive-pi-context')
	if (found) return found

	// 4. Bundled resources (production builds).
	const bundled = join(
		resourcesPath ?? process.env.SUPERHIVE_RESOURCES_PATH ?? '',
		'extensions',
		'superhive-pi-context',
	)
	const packaged = join(resourcesPath ?? process.resourcesPath ?? '', 'runtime', 'extensions', 'superhive-pi-context')
	if (hasSentinel(packaged)) return packaged
	if (hasSentinel(bundled)) return bundled

	throw new Error(
		`superhive-pi-context not found.\n` +
			`Checked env override (SUPERHIVE_PI_CONTEXT_PATH): ${override ?? '(unset)'}\n` +
			`Checked walk-up from cwd (${process.cwd()}): no matching dir\n` +
			`Checked bundled path: ${bundled}\n` +
			`Ensure the extension source is available (dev checkout at workspace root, ` +
			`prepared .runtime bundle or packaged extraResources).`,
	)
}
