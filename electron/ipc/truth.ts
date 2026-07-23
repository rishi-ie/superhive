/**
 * Generic truth-file IPC.
 *
 * Phase C: the renderer's Manage tab renders dynamic per-extension
 * sections (one per `<agentDir>/superhive-pi-<name>.json` discovered
 * at runtime). Truth owns the canonical schema for each ext-truth
 * file (settings-schema.ts in superhive-pi-truth), but the renderer
 * needs a generic way to list, read, and write these files without
 * the main process knowing about every extension in advance.
 *
 * Three channels:
 *   - truth:list-files — enumerate every truth file under <agentDir>:
 *     the 4 canonical files (settings/manage/overview/inbox) + any
 *     per-extension file matching `superhive-pi-*.json`. Returns
 *     metadata so the renderer can render a section per file.
 *   - truth:read-file — read one ext-truth file (canonical files use
 *     their own dedicated channels).
 *   - truth:write-file — atomic write + counter bump on any ext-truth
 *     file. Mirrors the same tmp+rename+counter pattern as the
 *     existing WRITE_SETTINGS handler.
 *
 * The cascade engine (in superhive-pi-truth/cascade.ts) is the
 * canonical writer for ext-truth files triggered by manage.json
 * changes. These channels are for direct user edits via the Manage
 * tab's dynamic sections.
 */

import { ipcMain } from 'electron'
import { existsSync } from 'node:fs'
import { readFile, writeFile, rename } from 'node:fs/promises'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { IPC } from './index'
import { AgentRepository } from '../../src/storage/repositories/AgentRepository'
import { runtime } from '../general-kai-runtime'
import {
	settingsFilePathFor,
	manageFilePathFor,
	overviewFilePathFor,
	inboxFilePathFor,
	parseCounter,
} from '../agent-settings-defaults'
import log from 'electron-log/main'

const EXT_FILE_PREFIX = 'superhive-pi-'
const EXT_FILE_SUFFIX = '.json'
const MAX_WRITE_RETRIES = 3

export interface TruthFileEntry {
	/** The on-disk filename. e.g. "settings.json" or "superhive-pi-plan.json". */
	fileName: string
	/** Logical ext name. e.g. "settings" for canonical, "superhive-pi-plan" for ext files. */
	extName: string
	exists: boolean
	/** Last writer tag + counter (e.g. "superhive-pi-truth@1#5") or null. */
	managedBy: string | null
	/** ISO timestamp of the last write, or null if the file doesn't exist. */
	lastModified: string | null
}

export interface TruthReadResult {
	content: Record<string, unknown>
	managedBy: string | null
	lastModified: string | null
}

export interface TruthWriteResult {
	ok: boolean
	writtenVersion: number
}

export interface TruthWriteInput {
	extName: string
	/** Object to merge over the current file contents. */
	patch: Record<string, unknown>
}

const CANONICAL_TRUTH_FILES: ReadonlyArray<{ fileName: string; extName: string; pathFor: (dir: string) => string }> = [
	{ fileName: 'settings.json', extName: 'settings', pathFor: settingsFilePathFor },
	{ fileName: 'manage.json', extName: 'manage', pathFor: manageFilePathFor },
	{ fileName: 'overview.json', extName: 'overview', pathFor: overviewFilePathFor },
	{ fileName: 'inbox.json', extName: 'inbox', pathFor: inboxFilePathFor },
]

/**
 * Enumerate every truth file for an agent. Returns metadata for the
 * 4 canonical files (whether or not they exist) plus any
 * `superhive-pi-*.json` files actually present on disk.
 *
 * Files are sorted by extName for stable ordering in the renderer's
 * dynamic sections list.
 */
async function listTruthFiles(agentDir: string): Promise<TruthFileEntry[]> {
	const out: TruthFileEntry[] = []

	for (const { fileName, extName, pathFor } of CANONICAL_TRUTH_FILES) {
		const path = pathFor(agentDir)
		out.push(await readEntry(path, fileName, extName))
	}

	let extEntries: string[] = []
	try {
		const entries = await readdir(agentDir)
		extEntries = entries.filter(
			(name) =>
				name.startsWith(EXT_FILE_PREFIX) &&
				name.endsWith(EXT_FILE_SUFFIX) &&
				name.length > EXT_FILE_PREFIX.length + EXT_FILE_SUFFIX.length,
		)
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err)
		log.warn(`[truth:list-files] readdir(${agentDir}) failed: ${msg}`)
	}

	for (const fileName of extEntries) {
		const path = join(agentDir, fileName)
		const extName = fileName.slice(0, -EXT_FILE_SUFFIX.length)
		out.push(await readEntry(path, fileName, extName))
	}

	out.sort((a, b) => a.extName.localeCompare(b.extName))
	return out
}

async function readEntry(path: string, fileName: string, extName: string): Promise<TruthFileEntry> {
	if (!existsSync(path)) {
		return { fileName, extName, exists: false, managedBy: null, lastModified: null }
	}
	try {
		const raw = await readFile(path, 'utf8')
		const parsed = JSON.parse(raw) as { managedBy?: string; lastModified?: string }
		return {
			fileName,
			extName,
			exists: true,
			managedBy: typeof parsed.managedBy === 'string' ? parsed.managedBy : null,
			lastModified: typeof parsed.lastModified === 'string' ? parsed.lastModified : null,
		}
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err)
		log.warn(`[truth:list-files] failed to read ${path}: ${msg}`)
		return { fileName, extName, exists: true, managedBy: null, lastModified: null }
	}
}

function resolveExtTruthPath(agentDir: string, extName: string): string {
	const canonical = CANONICAL_TRUTH_FILES.find((c) => c.extName === extName)
	if (canonical) return canonical.pathFor(agentDir)

	// Defensive: reject anything that doesn't look like an ext-truth file name.
	// extName is "<name>" for canonical (settings/manage/overview/inbox) and
	// "superhive-pi-<name>" for ext files. Reject path traversal, special chars,
	// and unknown prefixes.
	if (extName.includes('/') || extName.includes('\\') || extName.includes('..')) {
		throw new Error(`Invalid extName: ${JSON.stringify(extName)}`)
	}
	if (extName !== 'settings' && extName !== 'manage' && extName !== 'overview' && extName !== 'inbox' && !extName.startsWith(EXT_FILE_PREFIX)) {
		throw new Error(`Invalid extName: ${JSON.stringify(extName)} (must start with "${EXT_FILE_PREFIX}")`)
	}
	return join(agentDir, `${extName}${EXT_FILE_SUFFIX}`)
}

export function registerTruthIpc(): void {
	ipcMain.handle(IPC.TRUTH.LIST_FILES, async (_e, agentId: string): Promise<TruthFileEntry[]> => {
		const agent = await AgentRepository.getById(agentId)
		if (!agent?.localPath) throw new Error(`Agent not found: ${agentId}`)
		runtime.ensureSettingsWatcher(agentId, settingsFilePathFor(agent.localPath))
		return listTruthFiles(agent.localPath)
	})

	ipcMain.handle(
		IPC.TRUTH.READ_FILE,
		async (_e, agentId: string, extName: string): Promise<TruthReadResult | null> => {
			const agent = await AgentRepository.getById(agentId)
			if (!agent?.localPath) throw new Error(`Agent not found: ${agentId}`)
			const path = resolveExtTruthPath(agent.localPath, extName)
			runtime.ensureSettingsWatcher(agentId, settingsFilePathFor(agent.localPath))
			if (!existsSync(path)) return null
			const raw = await readFile(path, 'utf8')
			const parsed = JSON.parse(raw) as { managedBy?: string; lastModified?: string; [k: string]: unknown }
			const { managedBy, lastModified, ...content } = parsed
			return {
				content,
				managedBy: typeof managedBy === 'string' ? managedBy : null,
				lastModified: typeof lastModified === 'string' ? lastModified : null,
			}
		},
	)

	ipcMain.handle(
		IPC.TRUTH.WRITE_FILE,
		async (_e, agentId: string, input: TruthWriteInput): Promise<TruthWriteResult> => {
			if (!input || typeof input.extName !== 'string') {
				throw new Error('truth:write-file requires { extName, patch }')
			}
			if (!input.patch || typeof input.patch !== 'object' || Array.isArray(input.patch)) {
				throw new Error('truth:write-file patch must be a JSON object')
			}
			const agent = await AgentRepository.getById(agentId)
			if (!agent?.localPath) throw new Error(`Agent not found: ${agentId}`)
			const path = resolveExtTruthPath(agent.localPath, input.extName)

			// Atomic write with retry — mirrors WRITE_SETTINGS pattern.
			// Reads current, computes next counter, writes tmp, renames,
			// verifies byte-equality to detect lost races.
			for (let attempt = 0; attempt < MAX_WRITE_RETRIES; attempt++) {
				const raw = await readFile(path, 'utf8').catch(() => '{"version":1}')
				const current = JSON.parse(raw) as Record<string, unknown>
				const myCounter = parseCounter(current.managedBy as string | undefined) + 1
				const merged: Record<string, unknown> = {
					...current,
					...input.patch,
					managedBy: `superhive-pi-truth@1#${myCounter}`,
					lastModified: new Date().toISOString(),
				}
				const serialized = JSON.stringify(merged, null, '\t') + '\n'
				const tmp = `${path}.${process.pid}.${Date.now()}.${attempt}.tmp`
				await writeFile(tmp, serialized, 'utf8')
				await rename(tmp, path)
				const verify = JSON.parse(await readFile(path, 'utf8')) as Record<string, unknown>
				if (JSON.stringify(verify, null, '\t') + '\n' === serialized) {
					// settings-watcher emits agent:<id>:settings-changed on
					// any change in <agentDir>; the renderer's hooks will
					// re-fetch the file they care about. No explicit event
					// fanout needed here.
					return {
						ok: true,
						writtenVersion: parseCounter(verify.managedBy as string | undefined),
					}
				}
				// Raced — re-read and retry
			}

			throw new Error(`truth:write-file(${input.extName}): exceeded max retries (${MAX_WRITE_RETRIES})`)
		},
	)
}
