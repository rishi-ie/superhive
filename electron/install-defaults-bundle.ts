/**
 * Defaults bundle orchestrator.
 *
 * Runs the app-level template installer — `installTemplates` — that
 * populates the user's Superhive home with bundled marketplace
 * templates. Runs once at app startup, is idempotent (existing
 * user-edited files win), and never overwrites.
 *
 * Errors are swallowed and logged. The app must boot even if
 * bundled content can't be installed — the existing general-kai
 * template install follows the same pattern (warn + continue).
 */

import log from 'electron-log/main'
import {
	installTemplates,
	type InstallTemplatesResult,
} from './install-templates'

export interface InstallDefaultsBundleResult {
	templates: InstallTemplatesResult | null
}

export function installDefaultsBundle(): InstallDefaultsBundleResult {
	const result: InstallDefaultsBundleResult = {
		templates: null,
	}

	try {
		result.templates = installTemplates()
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err)
		log.error(`[install-defaults-bundle] templates failed: ${msg}`)
	}

	return result
}
