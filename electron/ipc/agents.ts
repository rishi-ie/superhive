import { ipcMain, BrowserWindow } from 'electron'
import { mkdir, cp, writeFile, chmod, rename, readFile } from 'node:fs/promises'
import { existsSync, symlinkSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import log from 'electron-log/main'
import { runtime } from '../general-kai-runtime'
import { ensureExtension } from '../extension-source'
import { AgentRepository } from '../../src/storage/repositories/AgentRepository'
import type { Agent, AgentStatus, AgentKind } from '../../src/storage/types'
import { IPC } from './index'
import { GENERAL_KAI_DIR, ensureGeneralKai } from '../install-general-kai'
import { config } from '../config'
import { chatFilePath, readAll as getAgentChatMessages } from '../agent-chat-store'
import {
	type SettingsFile,
	DEFAULT_SETTINGS,
	manageFilePathFor,
	overviewFilePathFor,
	inboxFilePathFor,
	parseCounter,
	settingsFilePathFor,
} from '../agent-settings-defaults'
import { revealInFinder } from './reveal-in-finder'
import { getTopEnabledModel } from '../get-top-enabled-model'
import { patchCoordinatorForMemberStatus } from '../project-status-mirror'
import { resolveContextExtensionPath } from '../install-context'
import { resolveOrchestrationExtensionPath } from '../install-orchestration'
import { resolvePlanExtensionPath } from '../install-plan'
import {
	installProjectAgentSkills,
	BUNDLED_SKILL_NAMES,
} from '../install-project-agent-skills'

function sanitizeFolderName(raw: string): string {
	const trimmed = raw.trim()
	if (!trimmed) return ''
	if (trimmed === '.' || trimmed === '..') return ''
	if (trimmed.includes('/') || trimmed.includes('\\')) return ''
	return trimmed.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '')
}

/**
 * Recursive deep-merge. Mirrors the truth ext's helper at
 * `superhive-pi-truth/settings-schema.ts:747-770`.
 *
 * Semantics:
 *  - objects: recurse
 *  - arrays: replace (not concat)
 *  - primitives and `null`: replace (`null` = set to null, not delete)
 *  - `undefined`: ignored (so an explicit "no change" can be sent)
 */
function deepMerge<T>(base: T, overrides: unknown): T {
	if (overrides === null || overrides === undefined) return base
	if (typeof base !== 'object' || base === null || Array.isArray(base)) {
		return (overrides as T) ?? base
	}
	if (typeof overrides !== 'object' || Array.isArray(overrides)) {
		return (overrides as T) ?? base
	}
	const result: Record<string, unknown> = { ...(base as Record<string, unknown>) }
	for (const [key, value] of Object.entries(overrides as Record<string, unknown>)) {
		const baseValue = result[key]
		if (
			typeof baseValue === 'object' &&
			baseValue !== null &&
			!Array.isArray(baseValue) &&
			typeof value === 'object' &&
			value !== null &&
			!Array.isArray(value)
		) {
			result[key] = deepMerge(baseValue, value)
		} else if (value !== undefined) {
			result[key] = value
		}
	}
	return result as T
}

const SUPERHIVE_PI_TRUTH_NAME = 'superhive-pi-truth'
const SUPERHIVE_PI_TRUTH_URL = 'https://github.com/rishi-ie/superhive-pi-truth.git'
const SUPERHIVE_PI_TELEMETRY_NAME = 'superhive-pi-telemetry'
const SUPERHIVE_PI_TELEMETRY_URL = 'https://github.com/rishi-ie/superhive-pi-telemetry.git'
const SUPERHIVE_PI_CONTEXT_NAME = 'superhive-pi-context'
const SUPERHIVE_PI_ORCHESTRATION_NAME = 'superhive-pi-orchestration'
const SUPERHIVE_PI_PLAN_NAME = 'superhive-pi-plan'

interface CreateAgentInput {
	name: string
	folderName: string
	parentDir: string
	role?: string
	description?: string
	agentKind?: string
	/**
	 * Gap 1: when creating a project-coordinator, pass the parent project's id
	 * so the seed SettingsFile can carry the `project` block the orchestration
	 * extension reads on session_start. Ignored for non-coordinator agents.
	 */
	projectId?: string
}

export function registerAgentIpc(): void {
	ipcMain.handle(IPC.AGENTS.LIST, () => AgentRepository.getAll())

	ipcMain.handle(IPC.AGENTS.GET, async (_e, id: string) => {
		return (await AgentRepository.getById(id)) ?? null
	})

	ipcMain.handle(
		IPC.AGENTS.CREATE,
		async (_e, data: CreateAgentInput): Promise<Agent> => {
			if (!data.name?.trim()) throw new Error('Agent name is required')
			if (!data.folderName?.trim()) throw new Error('Agent folder name is required')
			if (!data.parentDir?.trim()) throw new Error('Parent directory is required')

			ensureGeneralKai()

			const rawFolderName = data.folderName.trim()
			const folderName = sanitizeFolderName(rawFolderName)
			if (!folderName) {
				throw new Error(
					`Invalid folder name "${rawFolderName}" — cannot be empty, ".", "..", or contain path separators`,
				)
			}
			const parentDir = data.parentDir.trim().replace(/^~(?=\/|$)/, process.env.HOME ?? '')

			await mkdir(parentDir, { recursive: true })

			const agentDir = join(parentDir, folderName)
			if (existsSync(agentDir)) {
				throw new Error(`Agent folder already exists: ${agentDir}`)
			}

			log.info(`[agents:create] creating agent dir ${agentDir}`)
			await mkdir(agentDir, { recursive: true })
			await mkdir(join(agentDir, 'extensions'), { recursive: true })

			// Copy agent.sh from the pre-installed template
			await cp(join(GENERAL_KAI_DIR, 'agent.sh'), join(agentDir, 'agent.sh'))
			await chmod(join(agentDir, 'agent.sh'), 0o755)

			// Ensure the extension is cloned to its canonical location, then symlink
			// it into the agent's extensions folder (zero copy, always fresh).
			const extensionSource = ensureExtension(SUPERHIVE_PI_TRUTH_NAME, { kind: 'git', url: SUPERHIVE_PI_TRUTH_URL })
			const extLink = join(agentDir, 'extensions', SUPERHIVE_PI_TRUTH_NAME)
			symlinkSync(extensionSource, extLink, 'dir')
			log.info(`[agents:create] symlinked ${SUPERHIVE_PI_TRUTH_NAME} from canonical clone`)

			const telemetrySource = ensureExtension(SUPERHIVE_PI_TELEMETRY_NAME, { kind: 'git', url: SUPERHIVE_PI_TELEMETRY_URL })
			const telemetryLink = join(agentDir, 'extensions', SUPERHIVE_PI_TELEMETRY_NAME)
			symlinkSync(telemetrySource, telemetryLink, 'dir')
			log.info(`[agents:create] symlinked ${SUPERHIVE_PI_TELEMETRY_NAME} from canonical clone`)

			const agent = await AgentRepository.create({
				name: data.name.trim(),
				role: data.role?.trim() || undefined,
				description: data.description?.trim() || undefined,
				localPath: agentDir,
				status: 'idle',
				agentKind: data.agentKind as AgentKind | undefined,
			})

			// Coordinators only: wire superhive-pi-context (local-bundled) and seed
			// the context-graph directory. Standard agents are unaffected.
			const isCoordinator = agent.agentKind === 'project-coordinator'
			const baseManifestExtensions: string[] = [
				'./extensions/superhive-pi-truth',
				'./extensions/superhive-pi-telemetry',
			]
			const baseSettingsExtensions: string[] = [
				'./extensions/superhive-pi-truth',
				'./extensions/superhive-pi-telemetry',
			]
			if (isCoordinator) {
				let contextSourcePath: string
				try {
					contextSourcePath = resolveContextExtensionPath(
						process.resourcesPath ?? process.env.SUPERHIVE_RESOURCES_PATH,
					)
				} catch (err) {
					log.error(`[agents:create] coordinator context extension missing: ${err instanceof Error ? err.message : String(err)}`)
					throw err
				}
				const contextSource = ensureExtension(SUPERHIVE_PI_CONTEXT_NAME, {
					kind: 'local',
					path: contextSourcePath,
				})
				const contextLink = join(agentDir, 'extensions', SUPERHIVE_PI_CONTEXT_NAME)
				symlinkSync(contextSource, contextLink, 'dir')
				log.info(`[agents:create] symlinked ${SUPERHIVE_PI_CONTEXT_NAME} from local bundle`)

				baseManifestExtensions.push('./extensions/superhive-pi-context')
				baseSettingsExtensions.push('./extensions/superhive-pi-context')

				// Gap 1: wire superhive-pi-orchestration (coordinator-only).
				// Resolved from local bundle — same pattern as superhive-pi-context.
				// See electron/install-orchestration.ts for the walk-up resolver.
				let orchestrationSourcePath: string
				try {
					orchestrationSourcePath = resolveOrchestrationExtensionPath(
						process.resourcesPath ?? process.env.SUPERHIVE_RESOURCES_PATH,
					)
				} catch (err) {
					log.error(`[agents:create] coordinator orchestration extension missing: ${err instanceof Error ? err.message : String(err)}`)
					throw err
				}
				const orchestrationSource = ensureExtension(SUPERHIVE_PI_ORCHESTRATION_NAME, {
					kind: 'local',
					path: orchestrationSourcePath,
				})
				const orchestrationLink = join(agentDir, 'extensions', SUPERHIVE_PI_ORCHESTRATION_NAME)
				symlinkSync(orchestrationSource, orchestrationLink, 'dir')
				log.info(`[agents:create] symlinked ${SUPERHIVE_PI_ORCHESTRATION_NAME} from local bundle`)

				baseManifestExtensions.push('./extensions/superhive-pi-orchestration')
				baseSettingsExtensions.push('./extensions/superhive-pi-orchestration')

				// Plan extension: coordinator-only. Resolved from local bundle —
				// same pattern as superhive-pi-orchestration above. See
				// electron/install-plan.ts for the walk-up resolver.
				let planSourcePath: string
				try {
					planSourcePath = resolvePlanExtensionPath(
						process.resourcesPath ?? process.env.SUPERHIVE_RESOURCES_PATH,
					)
				} catch (err) {
					log.error(`[agents:create] coordinator plan extension missing: ${err instanceof Error ? err.message : String(err)}`)
					throw err
				}
				const planSource = ensureExtension(SUPERHIVE_PI_PLAN_NAME, {
					kind: 'local',
					path: planSourcePath,
				})
				const planLink = join(agentDir, 'extensions', SUPERHIVE_PI_PLAN_NAME)
				symlinkSync(planSource, planLink, 'dir')
				log.info(`[agents:create] symlinked ${SUPERHIVE_PI_PLAN_NAME} from local bundle`)

				baseManifestExtensions.push('./extensions/superhive-pi-plan')
				baseSettingsExtensions.push('./extensions/superhive-pi-plan')

				await mkdir(join(agentDir, 'context', 'nodes'), { recursive: true })
				await mkdir(join(agentDir, 'context', '.lock'), { recursive: true })
				await writeFile(
					join(agentDir, 'context', 'meta.json'),
					JSON.stringify(
						{
							schemaVersion: 1,
							agentId: agent.id,
							projectId: agent.projectIds[0] ?? null,
							nextId: 1,
							updatedAt: new Date().toISOString(),
						},
						null,
						2,
					) + '\n',
					'utf8',
				)
				await writeFile(
					join(agentDir, 'context', 'index.json'),
					JSON.stringify({ schemaVersion: 1, entries: [], hash: '' }, null, 2) + '\n',
					'utf8',
				)
				await writeFile(join(agentDir, 'context', 'log.jsonl'), '', 'utf8')

				await mkdir(join(agentDir, 'skills', 'context-compaction'), { recursive: true })
				try {
					const skillSrc = join(contextSourcePath, 'skills', 'context-compaction', 'SKILL.md')
					if (existsSync(skillSrc)) {
						await cp(skillSrc, join(agentDir, 'skills', 'context-compaction', 'SKILL.md'))
					}
				} catch (err) {
					log.warn(`[agents:create] could not copy coordinator skill: ${err instanceof Error ? err.message : String(err)}`)
				}
			}

			// Minimal manifest — just enough for agent.sh --manifest to load Pi and the extension.
			// environment.MINIMAX_API_KEY is included so the agent has API access at first launch.
			const manifestContent = JSON.stringify(
				{
					superhiveId: agent.id,
					version: 1,
					workspace: './workspace',
					extensions: baseManifestExtensions,
					environment: {
						MINIMAX_API_KEY: config.minimaxApiKey,
					},
				},
				null,
				2,
			) + '\n'
			await writeFile(join(agentDir, 'manifest.json'), manifestContent, 'utf8')

			// Symlink agent.json → manifest.json so agent.sh's legacy --manifest flag
			// resolves to the populated manifest. This avoids agent.sh's first-run
			// bootstrap writing an empty default over our manifest.
			symlinkSync('manifest.json', join(agentDir, 'agent.json'))
			log.info(`[agents:create] symlinked agent.json → manifest.json`)

			// Seed the four truth files. The legacy file (settings.json only
			// with a merged shape) is gone — each new agent boots into the
			// 4-file split from day one. The truth ext's `loadFourFiles` will
			// migrate any legacy `Superhive-pi-<basename>.json` it finds on
			// first launch (e.g. when adopting a folder from an older agent).
			const topModel = await getTopEnabledModel()

			// settings.json — runtime essentials.
			const settingsSeed: SettingsFile = {
				...DEFAULT_SETTINGS,
				managedBy: 'superhive-pi-truth@1#0',
				lastModified: new Date().toISOString(),
				...(topModel && {
					model: { provider: topModel.provider, name: topModel.name },
					defaultProvider: topModel.provider,
					defaultModel: topModel.name,
					enabledModels: [topModel.id],
				}),
			}
			await writeFile(
				settingsFilePathFor(agentDir),
				JSON.stringify(settingsSeed, null, '\t') + '\n',
				'utf8',
			)

			// manage.json — identity + permissions + extensions + planMode +
			// (for coordinators) the project block. The seed is a clean
			// DEFAULT_MANAGE shape; the truth ext's validator fills in
			// any missing top-level fields on next read.
			const manageSeed = {
				version: 1 as const,
				managedBy: 'superhive-pi-truth@1#0',
				lastModified: new Date().toISOString(),
				identity: {
					name: data.name.trim(),
					description: data.description?.trim() ?? '',
					workspace: './workspace',
				},
				permissions: { filesystem: true, terminal: true, network: true },
				skills: BUNDLED_SKILL_NAMES.slice(),
				extensions: baseSettingsExtensions,
				prompts: [],
				packages: [],
				themes: [],
				behavior: {
					steeringMode: 'all',
					followUpMode: 'all',
					autoCompaction: true,
					autoRetry: true,
				},
				planMode: { defaultMode: 'auto' as const, thinkingLevel: 'inherit' as const },
				...(isCoordinator && data.projectId && {
					project: {
						id: data.projectId,
						name: data.name.trim(),
						description: data.description?.trim() ?? '',
						members: [],
					},
				}),
			}
			await writeFile(
				manageFilePathFor(agentDir),
				JSON.stringify(manageSeed, null, '\t') + '\n',
				'utf8',
			)

			// overview.json — empty snapshot. Coordinator auto-syncs name +
			// description from manage.json on first boot.
			await writeFile(
				overviewFilePathFor(agentDir),
				JSON.stringify(
					{
						version: 1,
						managedBy: 'superhive-pi-truth@1#0',
						lastModified: new Date().toISOString(),
						name: data.name.trim(),
						description: data.description?.trim() ?? '',
						team: [],
						focus: [],
						activity: [],
					},
					null,
					'\t',
				) + '\n',
				'utf8',
			)

			// inbox.json — empty array.
			await writeFile(
				inboxFilePathFor(agentDir),
				JSON.stringify(
					{
						version: 1,
						managedBy: 'superhive-pi-truth@1#0',
						lastModified: new Date().toISOString(),
						items: [],
					},
					null,
					'\t',
				) + '\n',
				'utf8',
			)

			// Phase A: copy the 5 bundled SKILL.md files into the
			// agent's own skills folder. Runs for project-coordinator
			// agents only (regular agents have no bundled skill list).
			// Per-skill idempotency — existing files are not overwritten.
			if (isCoordinator) {
				try {
					installProjectAgentSkills(agentDir)
				} catch (err) {
					const msg = err instanceof Error ? err.message : String(err)
					log.warn(`[agents:create] skill install failed for coordinator ${agent.id}: ${msg}`)
				}
			}

			const win = BrowserWindow.getAllWindows()[0]
			if (win && !win.isDestroyed()) {
				win.webContents.send(IPC.AGENTS.ON_CREATED(agent.id), {
					defaultModel: topModel?.id ?? null,
				})
			}

			return agent
		},
	)

	ipcMain.handle(
		IPC.AGENTS.UPDATE_STATUS,
		async (_e, id: string, status: AgentStatus, lastError?: string) => {
			const updated = await AgentRepository.update(id, { status, lastError })
			// Gap 1: mirror status to coordinator's truth file so the roster
			// stays fresh on external status flips (e.g. error from telemetry).
			if (updated) {
				await patchCoordinatorForMemberStatus(id, status)
			}
			return updated
		},
	)

	ipcMain.handle(IPC.AGENTS.DELETE, async (_e, id: string) => {
		const agent = await AgentRepository.getById(id)
		if (!agent) return false

		const status = runtime.getStatusPayload(id)
		if (status && status.status !== 'idle') {
			await runtime.stop(id)
		}

		const deleted = await AgentRepository.delete(id)
		if (!deleted) return false

		if (agent.localPath && existsSync(agent.localPath)) {
			log.info(`[agents:delete] removing ${agent.localPath}`)
			await rm(agent.localPath, { recursive: true, force: true })
		}
		return true
	})

	ipcMain.handle(IPC.AGENTS.GET_PROJECTS, async (_e, agentId: string) => {
		return AgentRepository.getProjects(agentId)
	})

	ipcMain.handle(IPC.AGENTS.READ_SETTINGS, async (_e, agentId: string) => {
		const agent = await AgentRepository.getById(agentId)
		if (!agent?.localPath) throw new Error(`Agent not found: ${agentId}`)
		const settingsPath = settingsFilePathFor(agent.localPath)
		if (!existsSync(settingsPath)) return null
		const raw = await readFile(settingsPath, 'utf8')
		runtime.ensureSettingsWatcher(agentId, settingsPath)
		return JSON.parse(raw)
	})

	ipcMain.handle(
		IPC.AGENTS.WRITE_SETTINGS,
		async (_e, agentId: string, patch: Record<string, unknown>) => {
			const agent = await AgentRepository.getById(agentId)
			if (!agent?.localPath) throw new Error(`Agent not found: ${agentId}`)
			const settingsPath = settingsFilePathFor(agent.localPath)

			const writeAttempt = async (): Promise<Record<string, unknown>> => {
				const raw = await readFile(settingsPath, 'utf8').catch(() =>
					JSON.stringify(DEFAULT_SETTINGS, null, '\t'),
				)
				const current = JSON.parse(raw) as Record<string, unknown>
				const myCounter = parseCounter(current.managedBy as string | undefined) + 1
				const merged: Record<string, unknown> = {
					...current,
					...patch,
					managedBy: `superhive-pi-truth@1#${myCounter}`,
					lastModified: new Date().toISOString(),
				}
				return merged
			}

			let merged: Record<string, unknown> = {}
			for (let attempt = 0; attempt < 3; attempt++) {
				merged = await writeAttempt()
				const serialized = JSON.stringify(merged, null, '\t') + '\n'
				const tmp = `${settingsPath}.${process.pid}.${Date.now()}.${attempt}.tmp`
				await writeFile(tmp, serialized, 'utf8')
				await rename(tmp, settingsPath)
				const verify = JSON.parse(
					await readFile(settingsPath, 'utf8'),
				) as Record<string, unknown>
				// Verify our exact content landed. Counter-only check races when
				// two writers compute the same counter from the same base; the
				// last write wins silently. Re-stringify the verify and check
				// byte-for-byte equality with what we wrote.
				if (JSON.stringify(verify, null, '\t') + '\n' === serialized) {
					runtime.markSelfWrite(agentId, 'settings', parseCounter(verify.managedBy as string | undefined))
					return merged
				}
				// Raced — re-read and retry
			}

			throw new Error('WRITE_SETTINGS: exceeded max retries (3)')
		},
	)

	ipcMain.handle(IPC.AGENTS.GET_MESSAGES, async (_e, agentId: string) => {
		const agent = await AgentRepository.getById(agentId)
		if (!agent?.localPath) return []
		return getAgentChatMessages(chatFilePath(agent.localPath))
	})

	// -------------------------------------------------------------------------
	// 4-file truth split: per-file IPC channels (manage/overview/inbox)
	// -------------------------------------------------------------------------

	ipcMain.handle(IPC.AGENTS.READ_MANAGE, async (_e, agentId: string) => {
		const agent = await AgentRepository.getById(agentId)
		if (!agent?.localPath) throw new Error(`Agent not found: ${agentId}`)
		const filePath = manageFilePathFor(agent.localPath)
		if (!existsSync(filePath)) return null
		runtime.ensureSettingsWatcher(agentId, settingsFilePathFor(agent.localPath))
		return JSON.parse(await readFile(filePath, 'utf8'))
	})

	ipcMain.handle(
		IPC.AGENTS.WRITE_MANAGE,
		async (_e, agentId: string, patch: Record<string, unknown>) => {
			const agent = await AgentRepository.getById(agentId)
			if (!agent?.localPath) throw new Error(`Agent not found: ${agentId}`)
			const filePath = manageFilePathFor(agent.localPath)
			const writeAttempt = async (): Promise<Record<string, unknown>> => {
				const raw = await readFile(filePath, 'utf8').catch(() => '{}')
				const current = JSON.parse(raw) as Record<string, unknown>
				const myCounter = parseCounter(current.managedBy as string | undefined) + 1
				// Recursive deep-merge: partial blocks never wipe siblings.
				// (Old code did `{ ...current, ...patch }` which REPLACED
				// top-level keys — toggling one `behavior.autoCompaction`
				// would wipe `steeringMode`, `compaction`, etc.)
				const merged = deepMerge(current, patch) as Record<string, unknown>
				merged.version = 1
				merged.managedBy = `superhive-pi-truth@1#${myCounter}`
				merged.lastModified = new Date().toISOString()
				return merged
			}
			let merged: Record<string, unknown> = {}
			for (let attempt = 0; attempt < 3; attempt++) {
				merged = await writeAttempt()
				const serialized = JSON.stringify(merged, null, '\t') + '\n'
				const tmp = `${filePath}.${process.pid}.${Date.now()}.${attempt}.tmp`
				await writeFile(tmp, serialized, 'utf8')
				await rename(tmp, filePath)
				const verify = JSON.parse(await readFile(filePath, 'utf8')) as Record<string, unknown>
				if (JSON.stringify(verify, null, '\t') + '\n' === serialized) {
					runtime.markSelfWrite(agentId, 'manage', parseCounter(verify.managedBy as string | undefined))
					return { ok: true, writtenVersion: parseCounter(verify.managedBy as string | undefined) }
				}
			}
			throw new Error('WRITE_MANAGE: exceeded max retries (3)')
		},
	)

	ipcMain.handle(IPC.AGENTS.READ_OVERVIEW, async (_e, agentId: string) => {
		const agent = await AgentRepository.getById(agentId)
		if (!agent?.localPath) throw new Error(`Agent not found: ${agentId}`)
		const filePath = overviewFilePathFor(agent.localPath)
		if (!existsSync(filePath)) return null
		runtime.ensureSettingsWatcher(agentId, settingsFilePathFor(agent.localPath))
		return JSON.parse(await readFile(filePath, 'utf8'))
	})

	ipcMain.handle(
		IPC.AGENTS.WRITE_OVERVIEW,
		async (_e, agentId: string, patch: Record<string, unknown>) => {
			const agent = await AgentRepository.getById(agentId)
			if (!agent?.localPath) throw new Error(`Agent not found: ${agentId}`)
			const filePath = overviewFilePathFor(agent.localPath)
			const writeAttempt = async (): Promise<Record<string, unknown>> => {
				const raw = await readFile(filePath, 'utf8').catch(() => '{}')
				const current = JSON.parse(raw) as Record<string, unknown>
				const myCounter = parseCounter(current.managedBy as string | undefined) + 1
				return {
					...current,
					...patch,
					version: 1,
					managedBy: `superhive-pi-truth@1#${myCounter}`,
					lastModified: new Date().toISOString(),
				}
			}
			let merged: Record<string, unknown> = {}
			for (let attempt = 0; attempt < 3; attempt++) {
				merged = await writeAttempt()
				const serialized = JSON.stringify(merged, null, '\t') + '\n'
				const tmp = `${filePath}.${process.pid}.${Date.now()}.${attempt}.tmp`
				await writeFile(tmp, serialized, 'utf8')
				await rename(tmp, filePath)
				const verify = JSON.parse(await readFile(filePath, 'utf8')) as Record<string, unknown>
				if (JSON.stringify(verify, null, '\t') + '\n' === serialized) {
					runtime.markSelfWrite(agentId, 'overview', parseCounter(verify.managedBy as string | undefined))
					return { ok: true, writtenVersion: parseCounter(verify.managedBy as string | undefined) }
				}
			}
			throw new Error('WRITE_OVERVIEW: exceeded max retries (3)')
		},
	)

	ipcMain.handle(IPC.AGENTS.READ_INBOX_JSON, async (_e, agentId: string) => {
		const agent = await AgentRepository.getById(agentId)
		if (!agent?.localPath) throw new Error(`Agent not found: ${agentId}`)
		const filePath = inboxFilePathFor(agent.localPath)
		if (!existsSync(filePath)) return null
		runtime.ensureSettingsWatcher(agentId, settingsFilePathFor(agent.localPath))
		return JSON.parse(await readFile(filePath, 'utf8'))
	})

	ipcMain.handle(
		IPC.AGENTS.APPEND_INBOX,
		async (_e, agentId: string, input: { kind: string; message: string; severity?: string; payload?: Record<string, unknown> }) => {
			const agent = await AgentRepository.getById(agentId)
			if (!agent?.localPath) throw new Error(`Agent not found: ${agentId}`)
			const filePath = inboxFilePathFor(agent.localPath)
			const writeAttempt = async (): Promise<Record<string, unknown>> => {
				const raw = await readFile(filePath, 'utf8').catch(() => '{"version":1,"items":[]}')
				const current = JSON.parse(raw) as { version?: number; items?: unknown[]; managedBy?: string }
				const myCounter = parseCounter(current.managedBy) + 1
				const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
				const items = Array.isArray(current.items) ? current.items.slice() : []
				items.push({
					id,
					kind: input.kind,
					severity: input.severity,
					message: input.message,
					payload: input.payload,
					status: 'pending',
					createdAt: new Date().toISOString(),
				})
				return {
					...current,
					items,
					version: 1,
					managedBy: `superhive-pi-truth@1#${myCounter}`,
					lastModified: new Date().toISOString(),
				}
			}
			let merged: Record<string, unknown> = {}
			let id = ''
			for (let attempt = 0; attempt < 3; attempt++) {
				merged = await writeAttempt()
				id = (merged.items as { id: string }[]).slice(-1)[0]!.id
				const serialized = JSON.stringify(merged, null, '\t') + '\n'
				const tmp = `${filePath}.${process.pid}.${Date.now()}.${attempt}.tmp`
				await writeFile(tmp, serialized, 'utf8')
				await rename(tmp, filePath)
				const verify = JSON.parse(await readFile(filePath, 'utf8')) as Record<string, unknown>
				if (JSON.stringify(verify, null, '\t') + '\n' === serialized) {
					runtime.markSelfWrite(agentId, 'inbox', parseCounter(verify.managedBy as string | undefined))
					return { ok: true, id, writtenVersion: parseCounter(verify.managedBy as string | undefined) }
				}
			}
			throw new Error('APPEND_INBOX: exceeded max retries (3)')
		},
	)

	ipcMain.handle(
		IPC.AGENTS.MARK_INBOX_READ,
		async (_e, agentId: string, inboxId: string, answeredWith?: unknown) => {
			const agent = await AgentRepository.getById(agentId)
			if (!agent?.localPath) throw new Error(`Agent not found: ${agentId}`)
			const filePath = inboxFilePathFor(agent.localPath)
			const writeAttempt = async (): Promise<{ found: boolean; merged: Record<string, unknown> }> => {
				const raw = await readFile(filePath, 'utf8').catch(() => '{"version":1,"items":[]}')
				const current = JSON.parse(raw) as { items?: { id: string; status?: string; [k: string]: unknown }[]; managedBy?: string }
				const items = Array.isArray(current.items) ? current.items.slice() : []
				const idx = items.findIndex((i) => i.id === inboxId)
				if (idx === -1) {
					return { found: false, merged: current as Record<string, unknown> }
				}
				const target = items[idx]!
				items[idx] = {
					...target,
					status: answeredWith !== undefined ? 'answered' : 'read',
					updatedAt: new Date().toISOString(),
					answeredWith,
				}
				const myCounter = parseCounter(current.managedBy) + 1
				return {
					found: true,
					merged: {
						...current,
						items,
						version: 1,
						managedBy: `superhive-pi-truth@1#${myCounter}`,
						lastModified: new Date().toISOString(),
					},
				}
			}
			for (let attempt = 0; attempt < 3; attempt++) {
				const { found, merged } = await writeAttempt()
				if (!found) return { ok: false }
				const serialized = JSON.stringify(merged, null, '\t') + '\n'
				const tmp = `${filePath}.${process.pid}.${Date.now()}.${attempt}.tmp`
				await writeFile(tmp, serialized, 'utf8')
				await rename(tmp, filePath)
				const verify = JSON.parse(await readFile(filePath, 'utf8')) as Record<string, unknown>
				if (JSON.stringify(verify, null, '\t') + '\n' === serialized) {
					runtime.markSelfWrite(agentId, 'inbox', parseCounter(verify.managedBy as string | undefined))
					return { ok: true }
				}
			}
			throw new Error('MARK_INBOX_READ: exceeded max retries (3)')
		},
	)

	ipcMain.handle(
		IPC.AGENTS.CLEAR_INBOX,
		async (_e, agentId: string, status?: string) => {
			const agent = await AgentRepository.getById(agentId)
			if (!agent?.localPath) throw new Error(`Agent not found: ${agentId}`)
			const filePath = inboxFilePathFor(agent.localPath)
			const writeAttempt = async (): Promise<{ removed: number; merged: Record<string, unknown> }> => {
				const raw = await readFile(filePath, 'utf8').catch(() => '{"version":1,"items":[]}')
				const current = JSON.parse(raw) as { items?: { id: string; status?: string; [k: string]: unknown }[]; managedBy?: string }
				const items = Array.isArray(current.items) ? current.items : []
				const before = items.length
				const next = status === undefined ? [] : items.filter((i) => i.status !== status)
				const removed = before - next.length
				const myCounter = parseCounter(current.managedBy) + 1
				return {
					removed,
					merged: {
						...current,
						items: next,
						version: 1,
						managedBy: `superhive-pi-truth@1#${myCounter}`,
						lastModified: new Date().toISOString(),
					},
				}
			}
			let merged: Record<string, unknown> = {}
			let removed = 0
			for (let attempt = 0; attempt < 3; attempt++) {
				const r = await writeAttempt()
				merged = r.merged
				removed = r.removed
				const serialized = JSON.stringify(merged, null, '\t') + '\n'
				const tmp = `${filePath}.${process.pid}.${Date.now()}.${attempt}.tmp`
				await writeFile(tmp, serialized, 'utf8')
				await rename(tmp, filePath)
				const verify = JSON.parse(await readFile(filePath, 'utf8')) as Record<string, unknown>
				if (JSON.stringify(verify, null, '\t') + '\n' === serialized) {
					runtime.markSelfWrite(agentId, 'inbox', parseCounter(verify.managedBy as string | undefined))
					return { ok: true, removed }
				}
			}
			throw new Error('CLEAR_INBOX: exceeded max retries (3)')
		},
	)

	ipcMain.handle(IPC.AGENTS.REVEAL, async (_e, agentId: string) => {
		return revealInFinder(agentId)
	})

	// -------------------------------------------------------------------------
	// Phase E: spawn-from-template
	// Project-coordinator agents can spawn regular agents on the fly from
	// marketplace templates. The spawn ext (in the spawner agent's Pi
	// subprocess) calls this handler via the IPC bridge; the main process
	// creates the agent directory, seeds manage.json from the rendered
	// template, and binds projectIds: [spawner.project.id].
	//
	// The spawned agent is NOT started — the user starts it from
	// AgentsListView. This matches the "no auto-start" contract from the
	// spawn ext.
	//
	// Defense-in-depth: the handler re-validates that the spawner is a
	// project-coordinator agent. The spawn ext's gate is upstream but
	// the main process is the final line of defense.
	// -------------------------------------------------------------------------

	ipcMain.handle(
		IPC.AGENTS.SPAWN_FROM_TEMPLATE,
		async (
			_e,
			input: {
				spawnerAgentId: string
				projectId: string
				renderedTemplate: Record<string, unknown>
				name?: string
				role?: string
			},
		): Promise<{ agentId: string; status: string }> => {
			if (!input?.spawnerAgentId) throw new Error('spawnerAgentId is required')
			if (!input?.projectId) throw new Error('projectId is required')
			if (!input?.renderedTemplate || typeof input.renderedTemplate !== 'object') {
				throw new Error('renderedTemplate is required and must be an object')
			}

			// Defense-in-depth: re-validate the spawner is a project
			// coordinator. The spawn ext's gate is upstream; we re-check
			// here in case the spawn ext or its bridge were misconfigured.
			const spawner = await AgentRepository.getById(input.spawnerAgentId)
			if (!spawner) throw new Error(`Spawner agent not found: ${input.spawnerAgentId}`)
			if (spawner.agentKind !== 'project-coordinator') {
				throw new Error(
					`Spawner ${input.spawnerAgentId} is not a project-coordinator (agentKind=${spawner.agentKind}); refusing to spawn`,
				)
			}
			const spawnerProjectIds = Array.isArray(spawner.projectIds) ? spawner.projectIds : []
			if (!spawnerProjectIds.includes(input.projectId)) {
				throw new Error(
					`Spawner ${input.spawnerAgentId} is not bound to project ${input.projectId}; refusing to spawn`,
				)
			}

			// Extract a usable agent name. Priority: caller override →
			// template.identity.name → error (no nameable agent).
			const tplIdentity = (input.renderedTemplate.identity as { name?: unknown; role?: unknown } | undefined) ?? {}
			const baseName = (input.name?.trim() || (typeof tplIdentity.name === 'string' ? tplIdentity.name.trim() : ''))
			if (!baseName) {
				throw new Error('spawn-from-template: cannot determine agent name (no name override and template.identity.name missing)')
			}
			const role = (input.role?.trim() || (typeof tplIdentity.role === 'string' ? tplIdentity.role.trim() : '') || 'generalist')

			// Derive a folder name from the agent name. We use the
			// same sanitize scheme as agents:create so a coordinator
			// can spawn an agent, then a follow-up spawn with the same
			// name collides predictably.
			const folderName = sanitizeFolderName(baseName)
			if (!folderName) {
				throw new Error(`Invalid agent name "${baseName}" — cannot be empty after sanitization`)
			}

			// Spawned agents live at ~/.superhive/agents/<folderName>
			// (same parent as create).
			const parentDir = join(process.env.HOME ?? '', '.superhive', 'agents')
			const agentDir = join(parentDir, folderName)
			if (existsSync(agentDir)) {
				throw new Error(`Spawned agent folder already exists: ${agentDir}`)
			}
			await mkdir(parentDir, { recursive: true })
			await mkdir(agentDir, { recursive: true })
			await mkdir(join(agentDir, 'extensions'), { recursive: true })
			log.info(`[agents:spawn-from-template] creating agent dir ${agentDir}`)

			// Copy agent.sh + symlink truth + telemetry ONLY.
			// Spawned agents are regular agents, NOT project
			// coordinators — they don't get context, orch, or plan.
			ensureGeneralKai()
			await cp(join(GENERAL_KAI_DIR, 'agent.sh'), join(agentDir, 'agent.sh'))
			await chmod(join(agentDir, 'agent.sh'), 0o755)

			const extensionSource = ensureExtension(SUPERHIVE_PI_TRUTH_NAME, { kind: 'git', url: SUPERHIVE_PI_TRUTH_URL })
			symlinkSync(extensionSource, join(agentDir, 'extensions', SUPERHIVE_PI_TRUTH_NAME), 'dir')
			const telemetrySource = ensureExtension(SUPERHIVE_PI_TELEMETRY_NAME, { kind: 'git', url: SUPERHIVE_PI_TELEMETRY_URL })
			symlinkSync(telemetrySource, join(agentDir, 'extensions', SUPERHIVE_PI_TELEMETRY_NAME), 'dir')

			// Create the Agent row first so we have an id to thread
			// into the manage.json seed and any post-write cascades.
			// Note: AgentRepository.create() always initializes
			// projectIds: []; we add to projectIds[] after the
			// create via the repository's addToProject (or by
			// mutating the returned row before the next write).
			const agent = await AgentRepository.create({
				name: baseName,
				role,
				description: typeof tplIdentity.name === 'string' ? tplIdentity.name : undefined,
				localPath: agentDir,
				status: 'idle',
				// agentKind: undefined — spawned agents are regular, not coordinators
			})

			// Minimal manifest — same shape as create, but no env block
			// (the spawned agent inherits the user's env at launch time).
			const manifestContent = JSON.stringify(
				{
					superhiveId: agent.id,
					version: 1,
					workspace: './workspace',
					extensions: [
						'./extensions/superhive-pi-truth',
						'./extensions/superhive-pi-telemetry',
					],
				},
				null,
				2,
			) + '\n'
			await writeFile(join(agentDir, 'manifest.json'), manifestContent, 'utf8')
			symlinkSync('manifest.json', join(agentDir, 'agent.json'))

			// Seed settings.json with a top model.
			const topModel = await getTopEnabledModel()
			const settingsSeed: SettingsFile = {
				...DEFAULT_SETTINGS,
				managedBy: 'superhive-pi-truth@1#0',
				lastModified: new Date().toISOString(),
				...(topModel && {
					model: { provider: topModel.provider, name: topModel.name },
					defaultProvider: topModel.provider,
					defaultModel: topModel.name,
					enabledModels: [topModel.id],
				}),
			}
			await writeFile(
				settingsFilePathFor(agentDir),
				JSON.stringify(settingsSeed, null, '\t') + '\n',
				'utf8',
			)

			// Seed manage.json from the rendered template. We pluck the
			// standard fields the user expects; the rest of the rendered
			// template is preserved as a top-level `extras` block so
			// nothing in the template is silently dropped.
			const tplPerms = (input.renderedTemplate.permissions as { filesystem?: unknown; terminal?: unknown; network?: unknown } | undefined) ?? {}
			const tplBehavior = (input.renderedTemplate.behavior as { steeringMode?: unknown; followUpMode?: unknown; autoCompaction?: unknown; autoRetry?: unknown } | undefined) ?? {}
			const tplSkills = Array.isArray(input.renderedTemplate.skills) ? input.renderedTemplate.skills as string[] : []
			const manageSeed = {
				version: 1 as const,
				managedBy: 'superhive-pi-truth@1#0',
				lastModified: new Date().toISOString(),
				identity: {
					name: baseName,
					description: typeof tplIdentity.name === 'string' ? tplIdentity.name : '',
					workspace: './workspace',
				},
				permissions: {
					filesystem: tplPerms.filesystem !== false,
					terminal: tplPerms.terminal !== false,
					network: tplPerms.network !== false,
				},
				behavior: {
					steeringMode: (typeof tplBehavior.steeringMode === 'string' ? tplBehavior.steeringMode : 'all') as 'all' | 'one-at-a-time',
					followUpMode: (typeof tplBehavior.followUpMode === 'string' ? tplBehavior.followUpMode : 'all') as 'all' | 'one-at-a-time',
					autoCompaction: tplBehavior.autoCompaction !== false,
					autoRetry: tplBehavior.autoRetry !== false,
				},
				skills: tplSkills,
				extensions: [
					'./extensions/superhive-pi-truth',
					'./extensions/superhive-pi-telemetry',
				],
				prompts: [],
				packages: [],
				themes: [],
				planMode: { defaultMode: 'auto' as const, thinkingLevel: 'inherit' as const },
				// spawner-bound: the spawned agent carries the spawner's
				// project id so it shows up in project rosters.
				projectIds: [input.projectId],
			}
			await writeFile(
				manageFilePathFor(agentDir),
				JSON.stringify(manageSeed, null, '\t') + '\n',
				'utf8',
			)

			// overview.json — empty, will be populated by truth ext
			await writeFile(
				overviewFilePathFor(agentDir),
				JSON.stringify(
					{
						version: 1,
						managedBy: 'superhive-pi-truth@1#0',
						lastModified: new Date().toISOString(),
						name: baseName,
						description: '',
						team: [],
						focus: [],
						activity: [],
					},
					null,
					'\t',
				) + '\n',
				'utf8',
			)

			// inbox.json — empty array
			await writeFile(
				inboxFilePathFor(agentDir),
				JSON.stringify(
					{
						version: 1,
						managedBy: 'superhive-pi-truth@1#0',
						lastModified: new Date().toISOString(),
						items: [],
					},
					null,
					'\t',
				) + '\n',
				'utf8',
			)

			// Bind the spawned agent to the spawner's project. The
			// repo's create() always sets projectIds: [], so we
			// assignToProject post-create.
			await AgentRepository.assignToProject(agent.id, input.projectId)

			// Notify any listening renderer that a new agent exists.
			// (Same pattern as agents:create — broadcast on the
			// window so AgentsListView refreshes.)
			const { BrowserWindow } = await import('electron')
			const win = BrowserWindow.getAllWindows()[0]
			if (win && !win.isDestroyed()) {
				win.webContents.send(IPC.AGENTS.ON_CHANGED, { reason: 'spawned', agentId: agent.id })
			}

			log.info(
				`[agents:spawn-from-template] spawned ${agent.id} (${baseName}) bound to project=${input.projectId} from spawner=${input.spawnerAgentId}`,
			)
			return { agentId: agent.id, status: 'ready' }
		},
	)

  ipcMain.handle(
    IPC.AGENTS.PERSIST_ASSISTANT_MESSAGE,
    async (_e, agentId: string, message: import('../../src/models/assistant-message').AssistantMessage) => {
      runtime.persistAssistantMessage(agentId, message)
      return { ok: true }
    },
  )
}
