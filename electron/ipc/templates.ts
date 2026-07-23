/**
 * Templates IPC handlers.
 *
 * Phase F: the marketplace page (Phase F T-F-11..T-F-13) reads the
 * user's installed template library via these channels.
 *
 * The templates directory at `~/.superhive/templates/` is populated
 * at app startup by `installTemplates()`. The IPC handlers do not
 * know the source — they only see the installed copy (which may
 * include user edits).
 *
 * Three channels:
 *   - templates:list       — summaries for the cards grid
 *   - templates:get        — full JSON for the preview modal
 *   - templates:open-folder — `shell.openPath` the templates folder
 */

import { ipcMain, shell } from 'electron'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import log from 'electron-log/main'
import { IPC } from './index'
import { getTemplatesDir } from '../install-templates'

export interface TemplateSummary {
	id: string
	label: string
	description?: string
	category?: string
	icon?: string
}

export interface TemplateDetail {
	id: string
	label: string
	description?: string
	category?: string
	icon?: string
	version: number
	raw: Record<string, unknown>
}

function safeReadTemplateJson(id: string): Record<string, unknown> | null {
	const dir = getTemplatesDir()
	const path = join(dir, `${id}.json`)
	if (!existsSync(path)) return null
	try {
		const raw = readFileSync(path, 'utf8')
		return JSON.parse(raw) as Record<string, unknown>
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err)
		log.warn(`[ipc:templates] failed to read ${path}: ${msg}`)
		return null
	}
}

function toSummary(parsed: Record<string, unknown>): TemplateSummary {
	return {
		id: String(parsed.id ?? ''),
		label: typeof parsed.label === 'string' ? parsed.label : String(parsed.id ?? ''),
		description: typeof parsed.description === 'string' ? parsed.description : undefined,
		category: typeof parsed.category === 'string' ? parsed.category : undefined,
		icon: typeof parsed.icon === 'string' ? parsed.icon : undefined,
	}
}

function toDetail(parsed: Record<string, unknown>): TemplateDetail {
	return {
		...toSummary(parsed),
		version: typeof parsed.version === 'number' ? parsed.version : 1,
		raw: parsed,
	}
}

export function registerTemplatesIpc(): void {
	ipcMain.handle(IPC.TEMPLATES.LIST, async (): Promise<TemplateSummary[]> => {
		const dir = getTemplatesDir()
		if (!existsSync(dir)) return []
		let entries: string[]
		try {
			entries = readdirSync(dir)
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err)
			log.warn(`[ipc:templates:list] readdir failed for ${dir}: ${msg}`)
			return []
		}
		const out: TemplateSummary[] = []
		for (const name of entries) {
			if (!name.endsWith('.json')) continue
			const id = name.slice(0, -'.json'.length)
			const full = join(dir, name)
			try {
				if (!statSync(full).isFile()) continue
			} catch {
				continue
			}
			const parsed = safeReadTemplateJson(id)
			if (!parsed) continue
			out.push(toSummary(parsed))
		}
		// stable order: by label then id
		out.sort((a, b) => {
			const al = a.label.toLowerCase()
			const bl = b.label.toLowerCase()
			if (al < bl) return -1
			if (al > bl) return 1
			return a.id.localeCompare(b.id)
		})
		return out
	})

	ipcMain.handle(IPC.TEMPLATES.GET, async (_e, id: string): Promise<TemplateDetail | null> => {
		if (typeof id !== 'string' || !id) {
			throw new Error('templates:get requires a non-empty id')
		}
		// Defensive: id must match the file naming convention
		if (!/^[a-z0-9][a-z0-9._-]*$/.test(id)) {
			throw new Error(`templates:get invalid id: ${id}`)
		}
		const parsed = safeReadTemplateJson(id)
		if (!parsed) return null
		return toDetail(parsed)
	})

	ipcMain.handle(IPC.TEMPLATES.OPEN_FOLDER, async (): Promise<{ ok: boolean; path: string }> => {
		const dir = getTemplatesDir()
		if (!existsSync(dir)) {
			// Create an empty dir so the open call still works
			const { mkdirSync } = await import('node:fs')
			mkdirSync(dir, { recursive: true })
		}
		const result = await shell.openPath(dir)
		if (result) {
			// shell.openPath returns a non-empty string on failure
			log.warn(`[ipc:templates:open-folder] openPath returned: ${result}`)
		}
		return { ok: result === '', path: dir }
	})
}
