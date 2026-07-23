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
	parseCounter,
	settingsFilePathFor,
} from '../agent-settings-defaults'
import { revealInFinder } from './reveal-in-finder'
import { getTopEnabledModel } from '../get-top-enabled-model'
import { patchCoordinatorForMemberStatus } from '../project-status-mirror'
import { resolveContextExtensionPath } from '../install-context'
import { resolveOrchestrationExtensionPath } from '../install-orchestration'
import { resolvePlanExtensionPath } from '../install-plan'

function sanitizeFolderName(raw: string): string {
	const trimmed = raw.trim()
	if (!trimmed) return ''
	if (trimmed === '.' || trimmed === '..') return ''
	if (trimmed.includes('/') || trimmed.includes('\\')) return ''
	return trimmed.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '')
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

			// Seed the settings JSON so the extension sees it on first launch.
			// Pin both extensions into the active manifest so Pi's loadExtensions
			// takes the deterministic "explicit paths" branch — without this,
			// `extensions: []` ships in the seed, agent.sh picks the settings file
			// as the manifest on the first boot, and Pi loads NO extensions
			// (including truth itself), leaving telemetry dead and the
			// context-window ring showing "?" forever.
			// Mirrors superhive-pi-truth/index.ts::buildInitialSettings.
			const topModel = await getTopEnabledModel()
			const settingsPath = settingsFilePathFor(agentDir)
			const seed: SettingsFile = {
				...DEFAULT_SETTINGS,
				name: data.name.trim(),
				description: data.description?.trim() ?? '',
				managedBy: 'superhive-pi-truth@1#0',
				lastModified: new Date().toISOString(),
				extensions: baseSettingsExtensions,
				...(topModel && {
					model: { provider: topModel.provider, name: topModel.name },
					defaultProvider: topModel.provider,
					defaultModel: topModel.name,
					enabledModels: [topModel.id],
				}),
				// Gap 1: seed the project block for coordinators so the
				// orchestration extension can build the CEO prompt and read
				// member status on session_start. Members array is empty at
				// creation; populated as specialists are added to the project.
				...(isCoordinator && data.projectId && {
					project: {
						id: data.projectId,
						name: data.name.trim(),
						description: data.description?.trim() ?? '',
						members: [],
					},
				}),
			}
			await writeFile(settingsPath, JSON.stringify(seed, null, '\t') + '\n', 'utf8')

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
					runtime.markSelfWrite(agentId, parseCounter(verify.managedBy as string | undefined))
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

	ipcMain.handle(IPC.AGENTS.REVEAL, async (_e, agentId: string) => {
		return revealInFinder(agentId)
	})

  ipcMain.handle(
    IPC.AGENTS.PERSIST_ASSISTANT_MESSAGE,
    async (_e, agentId: string, message: import('../../src/models/assistant-message').AssistantMessage) => {
      runtime.persistAssistantMessage(agentId, message)
      return { ok: true }
    },
  )
}
