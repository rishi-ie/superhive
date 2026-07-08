import { ipcMain } from 'electron'
import { mkdir, cp, writeFile, chmod, rename, readFile } from 'node:fs/promises'
import { existsSync, symlinkSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import log from 'electron-log/main'
import { runtime } from '../manifest-pi-runtime'
import { getBundledExtensionPath, hasBundledExtension, BUNDLED_EXTENSION_NAME } from '../extension-source'
import { AgentRepository } from '../../src/storage/repositories/AgentRepository'
import type { Agent, AgentStatus } from '../../src/storage/types'
import { IPC } from './index'
import { TEMPLATE_DIR, ensureManifestPiTemplate } from '../install-bootstrap'
import { config } from '../config'
import {
	type SettingsFile,
	DEFAULT_SETTINGS,
	parseCounter,
	settingsFilePathFor,
} from '../agent-settings-defaults'

interface CreateAgentInput {
	name: string
	folderName: string
	parentDir: string
	role?: string
	description?: string
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

			ensureManifestPiTemplate()

			const folderName = data.folderName.trim()
			const parentDir = data.parentDir.trim().replace(/^~(?=\/|$)/, process.env.HOME ?? '')

			if (!/^[a-z0-9][a-z0-9-]*$/.test(folderName)) {
				throw new Error(
					'Folder name must be lowercase letters, digits, and hyphens (start with letter/digit)',
				)
			}

			await mkdir(parentDir, { recursive: true })

			const agentDir = join(parentDir, folderName)
			if (existsSync(agentDir)) {
				throw new Error(`Agent folder already exists: ${agentDir}`)
			}

			log.info(`[agents:create] creating agent dir ${agentDir}`)
			await mkdir(agentDir, { recursive: true })
			await mkdir(join(agentDir, 'extensions'), { recursive: true })

			// Copy agent.sh from the pre-installed template
			await cp(join(TEMPLATE_DIR, 'agent.sh'), join(agentDir, 'agent.sh'))
			await chmod(join(agentDir, 'agent.sh'), 0o755)

			// Symlink the bundled extension (zero copy, always fresh)
			if (hasBundledExtension()) {
				const extLink = join(agentDir, 'extensions', BUNDLED_EXTENSION_NAME)
				symlinkSync(getBundledExtensionPath(), extLink, 'dir')
				log.info(`[agents:create] symlinked bundled extension`)
			} else {
				log.error(
					`[agents:create] bundled extension missing at ${getBundledExtensionPath()} — ` +
					`settings flow unavailable. Rebuild: bun run build`,
				)
			}

			const agent = await AgentRepository.create({
				name: data.name.trim(),
				role: data.role?.trim() || undefined,
				description: data.description?.trim() || undefined,
				localPath: agentDir,
				status: 'initializing',
			})

			// Minimal manifest — just enough for agent.sh --manifest to load Pi and the extension.
			// environment.MINIMAX_API_KEY is included so the agent has API access at first launch.
			const manifestContent = JSON.stringify(
				{
					superhiveId: agent.id,
					version: 1,
					workspace: './workspace',
					extensions: ['./extensions/superhive-pi-truth'],
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

			// Seed the settings JSON so the extension sees it on first launch
			const settingsPath = settingsFilePathFor(agentDir)
			const seed: SettingsFile = {
				...DEFAULT_SETTINGS,
				name: data.name.trim(),
				description: data.description?.trim() ?? '',
				managedBy: 'superhive-pi-truth@1#0',
				lastModified: new Date().toISOString(),
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
}
