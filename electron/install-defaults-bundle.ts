/**
 * Defaults bundle orchestrator.
 *
 * Runs the two app-level installers — `installProjectAgentDefaults`
 * and `installTemplates` — that populate the user's Superhive home
 * with bundled content. These run once at app startup, are idempotent
 * (existing user-edited files win), and never overwrite.
 *
 * The third installer — `installProjectAgentSkills` — is NOT called
 * here. It runs per-agent inside the `agents:create` IPC handler
 * (when `agentKind === 'project-coordinator'`) because SKILL.md
 * files live under each agent's own folder, not in the user's home.
 *
 * All three errors are swallowed and logged. The app must boot even
 * if bundled content can't be installed — the existing general-kai
 * template install follows the same pattern (warn + continue).
 */

import log from 'electron-log/main'
import {
	installProjectAgentDefaults,
	type InstallDefaultsResult,
} from './install-project-agent-defaults'
import {
	installTemplates,
	type InstallTemplatesResult,
} from './install-templates'

export interface InstallDefaultsBundleResult {
	defaults: InstallDefaultsResult | null
	templates: InstallTemplatesResult | null
}

export function installDefaultsBundle(): InstallDefaultsBundleResult {
	const result: InstallDefaultsBundleResult = {
		defaults: null,
		templates: null,
	}

	try {
		result.defaults = installProjectAgentDefaults()
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err)
		log.error(`[install-defaults-bundle] project-agent-defaults failed: ${msg}`)
	}

	try {
		result.templates = installTemplates()
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err)
		log.error(`[install-defaults-bundle] templates failed: ${msg}`)
	}

	return result
}
