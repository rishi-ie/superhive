/**
 * Defaults IPC handlers.
 *
 * `defaults:get` reads the bundled project-agent-defaults.json from
 * the user's Superhive home (~/.superhive/project-agent-defaults.json,
 * populated by install-project-agent-defaults at startup). Used by:
 *   - CreateProjectDialog — to render the category picker with
 *     per-overlay preview text
 *   - Marketplace page (Phase F) — to show category metadata on each
 *     template card
 *   - Orchestration extension (Phase B) — to read overlays[category]
 *     systemPromptAddition fragments at session_start
 *
 * The IPC channel ships in Phase A because the dialog needs it now.
 * Phase F adds the templates:* channels.
 */

import { ipcMain } from 'electron'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { IPC } from './index'
import {
	getProjectAgentDefaultsPath,
} from '../install-project-agent-defaults'
import log from 'electron-log/main'

export interface ProjectAgentDefaultsOverlay {
	systemPromptAddition: string
	skills: string[]
}

export interface ProjectAgentDefaults {
	version: number
	base: {
		extensions: string[]
		skills: string[]
		permissions: { filesystem: boolean; terminal: boolean; network: boolean }
		behavior: {
			steeringMode: string
			followUpMode: string
			autoCompaction: boolean
			autoRetry: boolean
		}
	}
	overlays: Record<string, ProjectAgentDefaultsOverlay>
}

export function registerDefaultsIpc(): void {
	ipcMain.handle(IPC.DEFAULTS.GET, async (): Promise<ProjectAgentDefaults | null> => {
		const path = getProjectAgentDefaultsPath()
		if (!existsSync(path)) {
			log.warn(`[ipc:defaults:get] defaults file missing at ${path}`)
			return null
		}
		try {
			const raw = await readFile(path, 'utf8')
			const parsed = JSON.parse(raw) as ProjectAgentDefaults
			if (!parsed?.base || !parsed?.overlays) {
				log.warn(`[ipc:defaults:get] defaults file at ${path} missing base/overlays`)
				return null
			}
			return parsed
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err)
			log.error(`[ipc:defaults:get] failed to read defaults at ${path}: ${msg}`)
			return null
		}
	})
}
