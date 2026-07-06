/**
 * Canonical settings defaults and helpers for Superhive-pi-{folder}.json.
 *
 * The DEFAULT_SETTINGS value comes from the extension's settings-schema so both
 * the electron main process and the pi subprocess share the exact same defaults.
 *
 * Vite bundles this file at build time, inlining DEFAULT_SETTINGS into the
 * electron bundle. No runtime path to extensions/ is needed.
 */

import { basename, join } from 'node:path'
import { DEFAULT_SETTINGS, type SettingsFile } from 'extensions/superhive-pi-truth/settings-schema'

export type { SettingsFile }
export { DEFAULT_SETTINGS }

/**
 * Resolve the settings file path for a given agent root directory.
 *   /path/my-agent/  ->  /path/my-agent/Superhive-pi-my-agent.json
 */
export function settingsFilePathFor(agentDir: string): string {
	return join(agentDir, `Superhive-pi-${basename(agentDir)}.json`)
}

/**
 * Extract the writer counter N from a managedBy string like "superhive-pi-truth@1#5".
 * Returns 0 if not set or malformed.
 */
export function parseCounter(managedBy: string | undefined): number {
	const m = /#(\d+)$/.exec(managedBy ?? '')
	if (!m || !m[1]) return 0
	return parseInt(m[1], 10)
}
