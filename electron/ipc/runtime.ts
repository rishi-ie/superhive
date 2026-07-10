import { ipcMain } from 'electron'
import { existsSync } from 'node:fs'
import { readFile, writeFile, rename } from 'node:fs/promises'
import { runtime } from '../manifest-pi-runtime'
import { AgentRepository } from '../../src/storage/repositories/AgentRepository'
import { SettingsRepository } from '../../src/storage/repositories'
import { IPC } from './index'
import { TEMPLATE_DIR } from '../install-bootstrap'
import { settingsFilePathFor, type SettingsFile } from '../agent-settings-defaults'

/**
 * Auto-seed the per-agent `providers` block on agent start.
 *
 * Reads the global provider store (SettingsRepository, ownerType='global'),
 * merges it with any per-agent providers (per-agent wins — power-user override),
 * and also bootstraps the env-var MiniMax key from .env.local if no `minimax`
 * provider is configured. Non-breaking for existing dev workflows.
 */
async function autoSeedProviders(_agentId: string, agentDir: string): Promise<void> {
	const settingsPath = settingsFilePathFor(agentDir)

	let current: SettingsFile
	try {
		if (!existsSync(settingsPath)) return
		const raw = await readFile(settingsPath, 'utf8')
		current = JSON.parse(raw) as SettingsFile
	} catch {
		return
	}

	const globalRows = await SettingsRepository.getByOwnerAndGroup(
		'global',
		'global',
		'providers',
	)
	const globalProviders: Record<string, { name?: string; baseUrl?: string | null; apiKey?: string }> = {}
	for (const row of globalRows) {
		globalProviders[row.key] = (row.value as { name?: string; baseUrl?: string | null; apiKey?: string }) ?? {}
	}

	const perAgentProviders = current.providers ?? {}

	const merged: Record<string, { name?: string; baseUrl?: string | null; apiKey?: string }> = {
		...globalProviders,
		...perAgentProviders,
	}

	const envKey = process.env.MINIMAX_API_KEY?.trim()
	if (envKey && !merged.minimax) {
		merged.minimax = { name: 'minimax', apiKey: envKey }
	}

	if (Object.keys(merged).length === 0) return

	const next: SettingsFile = {
		...current,
		providers: merged,
		managedBy: 'superhive-pi-truth@1#0',
		lastModified: new Date().toISOString(),
	}

	const tmp = `${settingsPath}.tmp.${Date.now()}`
	await writeFile(tmp, JSON.stringify(next, null, '\t') + '\n', 'utf8')
	await rename(tmp, settingsPath)
}

export function registerRuntimeIpc(): void {
	ipcMain.handle(IPC.AGENTS.START, async (_e, agentId: string) => {
		const agent = await AgentRepository.getById(agentId)
		if (!agent) throw new Error(`Agent not found: ${agentId}`)
		if (!agent.localPath) throw new Error(`Agent has no localPath: ${agentId}`)
		await autoSeedProviders(agentId, agent.localPath)
		runtime.start(agentId, agent.localPath, TEMPLATE_DIR)
		await AgentRepository.update(agentId, { status: 'initializing', lastError: undefined })
		return { ok: true }
	})

	ipcMain.handle(IPC.AGENTS.STOP, async (_e, agentId: string) => {
		runtime.stop(agentId)
		await AgentRepository.update(agentId, { status: 'stopped' })
		return { ok: true }
	})

	ipcMain.handle(IPC.AGENTS.RESTART, async (_e, agentId: string) => {
		await autoSeedProviders(agentId, (await AgentRepository.getById(agentId))?.localPath ?? '')
		runtime.restart(agentId)
		await AgentRepository.update(agentId, { status: 'initializing', lastError: undefined })
		return { ok: true }
	})

	ipcMain.handle(IPC.AGENTS.SEND, async (_e, agentId: string, message: string) => {
		const ok = runtime.send(agentId, message)
		return { ok }
	})

	ipcMain.handle(IPC.AGENTS.GET_RUNTIME_STATE, (_e, agentId: string) => {
		return runtime.getStatusPayload(agentId)
	})
}