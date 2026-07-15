import { ipcMain } from 'electron'
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
import { readAll as getAgentChatMessages } from '../agent-chat-store'
import {
	type SettingsFile,
	DEFAULT_SETTINGS,
	parseCounter,
	settingsFilePathFor,
} from '../agent-settings-defaults'
import { revealInFinder } from './reveal-in-finder'

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

interface CreateAgentInput {
	name: string
	folderName: string
	parentDir: string
	role?: string
	description?: string
	agentKind?: string
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
			const extensionSource = ensureExtension(SUPERHIVE_PI_TRUTH_NAME, SUPERHIVE_PI_TRUTH_URL)
			const extLink = join(agentDir, 'extensions', SUPERHIVE_PI_TRUTH_NAME)
			symlinkSync(extensionSource, extLink, 'dir')
			log.info(`[agents:create] symlinked ${SUPERHIVE_PI_TRUTH_NAME} from canonical clone`)

			const telemetrySource = ensureExtension(SUPERHIVE_PI_TELEMETRY_NAME, SUPERHIVE_PI_TELEMETRY_URL)
			const telemetryLink = join(agentDir, 'extensions', SUPERHIVE_PI_TELEMETRY_NAME)
			symlinkSync(telemetrySource, telemetryLink, 'dir')
			log.info(`[agents:create] symlinked ${SUPERHIVE_PI_TELEMETRY_NAME} from canonical clone`)

			const agent = await AgentRepository.create({
				name: data.name.trim(),
				role: data.role?.trim() || undefined,
				description: data.description?.trim() || undefined,
				localPath: agentDir,
				status: 'initializing',
				agentKind: data.agentKind as AgentKind | undefined,
			})

			// Minimal manifest — just enough for agent.sh --manifest to load Pi and the extension.
			// environment.MINIMAX_API_KEY is included so the agent has API access at first launch.
			const manifestContent = JSON.stringify(
				{
					superhiveId: agent.id,
					version: 1,
					workspace: './workspace',
					extensions: [
						'./extensions/superhive-pi-truth',
						'./extensions/superhive-pi-telemetry',
					],
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
			const settingsPath = settingsFilePathFor(agentDir)
			const seed: SettingsFile = {
				...DEFAULT_SETTINGS,
				name: data.name.trim(),
				description: data.description?.trim() ?? '',
				managedBy: 'superhive-pi-truth@1#0',
				lastModified: new Date().toISOString(),
				extensions: [
					'./extensions/superhive-pi-truth',
					'./extensions/superhive-pi-telemetry',
				],
			}
			await writeFile(settingsPath, JSON.stringify(seed, null, '\t') + '\n', 'utf8')

			return agent
		},
	)

	ipcMain.handle(
		IPC.AGENTS.UPDATE_STATUS,
		async (_e, id: string, status: AgentStatus, lastError?: string) => {
			return AgentRepository.update(id, { status, lastError })
		},
	)

	ipcMain.handle(IPC.AGENTS.DELETE, async (_e, id: string) => {
		const agent = await AgentRepository.getById(id)
		if (!agent) return false

		const status = runtime.getStatusPayload(id)
		if (status && status.status !== 'stopped' && status.status !== 'idle') {
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

			for (let attempt = 0; attempt < 3; attempt++) {
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
				const tmp = `${settingsPath}.${process.pid}.${Date.now()}.${attempt}.tmp`
				await writeFile(tmp, JSON.stringify(merged, null, '\t') + '\n', 'utf8')
				await rename(tmp, settingsPath)
				const verify = JSON.parse(
					await readFile(settingsPath, 'utf8'),
				) as Record<string, unknown>
				if (parseCounter(verify.managedBy as string | undefined) <= myCounter) {
					runtime.markSelfWrite(agentId, myCounter)
					return merged
				}
				// Raced — re-read and retry
			}

			throw new Error('WRITE_SETTINGS: exceeded max retries (3)')
		},
	)

	ipcMain.handle(IPC.AGENTS.GET_MESSAGES, async (_e, agentId: string) => {
		return getAgentChatMessages(agentId)
	})

	ipcMain.handle(IPC.AGENTS.REVEAL, async (_e, agentId: string) => {
		return revealInFinder(agentId)
	})
}
