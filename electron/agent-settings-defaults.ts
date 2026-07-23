/**
 * Canonical settings defaults + per-file path helpers.
 *
 * The four truth files (settings.json, manage.json, overview.json,
 * inbox.json) live side-by-side under <agentDir>/. The legacy
 * Superhive-pi-{folder}.json file is migrated and deleted on first
 * launch by the truth extension itself.
 *
 * Bun installs `superhive-pi-truth` from GitHub (see package.json).
 * Vite bundles this file at build time, inlining the defaults into the
 * electron bundle.
 */

import { join } from 'node:path'
import {
	DEFAULT_INBOX,
	DEFAULT_MANAGE,
	DEFAULT_OVERVIEW,
	DEFAULT_SETTINGS,
	type InboxFile,
	type ManageFile,
	type OverviewFile,
	type SettingsFile,
} from 'superhive-pi-truth/settings-schema'

export type { SettingsFile, ManageFile, OverviewFile, InboxFile }
export { DEFAULT_SETTINGS, DEFAULT_MANAGE, DEFAULT_OVERVIEW, DEFAULT_INBOX }

/**
 * Resolve `<agentDir>/settings.json`. Hosts the runtime essentials
 * (model, env, providers, runtime, tier-2 UI flags, advanced,
 * catalog, sessionsIndex, lastEvent, checklist).
 */
export function settingsFilePathFor(agentDir: string): string {
	return join(agentDir, 'settings.json')
}

/**
 * Resolve `<agentDir>/manage.json`. Hosts the user-tweakable surface
 * (identity, permissions, behavior, skills/extensions/prompts/
 * packages/themes, planMode, project).
 */
export function manageFilePathFor(agentDir: string): string {
	return join(agentDir, 'manage.json')
}

/**
 * Resolve `<agentDir>/overview.json`. Hosts the right-sidebar Overview
 * snapshot (name + description mirrored from manage, health/team/
 * focus/activity).
 */
export function overviewFilePathFor(agentDir: string): string {
	return join(agentDir, 'overview.json')
}

/**
 * Resolve `<agentDir>/inbox.json`. Hosts the append-only inbox feed.
 */
export function inboxFilePathFor(agentDir: string): string {
	return join(agentDir, 'inbox.json')
}

/**
 * Extract the writer counter N from a managedBy string like
 * "superhive-pi-truth@1#5". Returns 0 if not set or malformed.
 */
export function parseCounter(managedBy: string | undefined): number {
	const m = /#(\d+)$/.exec(managedBy ?? '')
	if (!m || !m[1]) return 0
	return parseInt(m[1], 10)
}
