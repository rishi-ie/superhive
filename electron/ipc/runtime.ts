import { ipcMain } from 'electron'
import { existsSync } from 'node:fs'
import { readFile, writeFile, rename } from 'node:fs/promises'
import { runtime } from '../general-kai-runtime'
import { AgentRepository } from '../../src/storage/repositories/AgentRepository'
import { SettingsRepository } from '../../src/storage/repositories'
import { IPC } from './index'
import { GENERAL_KAI_DIR } from '../install-general-kai'
import { settingsFilePathFor, type SettingsFile } from '../agent-settings-defaults'

/**
 * Bootstrap env-var API keys from process.env into the `providers` map.
 * Scans any `*_API_KEY` env var, derives a provider name, and adds the entry
 * to `merged` only if the provider is not already configured. Non-breaking:
 * existing dev workflows with `.env.local` continue to work.
 *
 * The provider-name mapping mirrors the one in
 * `superhive-pi-truth/provider-map.ts::envVarToProvider` (consumed from the
 * superhive-pi-truth GitHub dependency). The two stay in sync manually until
 * the next refactor.
 */
function envVarNameToProvider(envVar: string): string | null {
	if (!envVar.endsWith('_API_KEY')) return null
	const stem = envVar.slice(0, -'_API_KEY'.length)
	const lower = stem.toLowerCase()
	const aliases: Record<string, string> = {
		openai: 'openai',
		anthropic: 'anthropic',
		minimax: 'minimax',
		gemini: 'google',
		deepseek: 'deepseek',
	}
	return aliases[lower] ?? lower
}

function bootstrapEnvProviders(
	merged: Record<string, { name?: string; baseUrl?: string | null; apiKey?: string }>,
): void {
	for (const [k, v] of Object.entries(process.env)) {
		if (!v) continue
		const provider = envVarNameToProvider(k)
		if (!provider) continue
		if (merged[provider]) continue
		merged[provider] = { name: provider, apiKey: v.trim() }
	}
}

/**
 * Re-seed the per-agent `providers` block by reading the global provider
 * store and merging it into the agent's settings file (per-agent wins).
 * Exported so the settings IPC handler can call this on provider add/update/delete.
 */
export async function reSeedProviders(agentId: string): Promise<void> {
	const agent = await AgentRepository.getById(agentId)
	if (!agent?.localPath) return
	const agentDir = agent.localPath
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

	bootstrapEnvProviders(merged)

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

/**
 * @deprecated Use `reSeedProviders` directly. Kept as a thin wrapper for
 * the START/RESTART IPC handlers that already pass `agentDir`.
 */
async function autoSeedProviders(agentId: string, agentDir: string): Promise<void> {
	// For START, agentDir is provided. For RESTART, we re-derive it.
	if (!agentDir) {
		await reSeedProviders(agentId)
		return
	}
	// agentDir is intentionally ignored; we re-derive from the agent record
	// so the source of truth is the database, not a stale parameter.
	await reSeedProviders(agentId)
}

export function registerRuntimeIpc(): void {
	ipcMain.handle(IPC.AGENTS.START, async (_e, agentId: string) => {
		const agent = await AgentRepository.getById(agentId)
		if (!agent) throw new Error(`Agent not found: ${agentId}`)
		if (!agent.localPath) throw new Error(`Agent has no localPath: ${agentId}`)
		await autoSeedProviders(agentId, agent.localPath)
		runtime.start(agentId, agent.localPath, GENERAL_KAI_DIR)
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

	ipcMain.handle(
		IPC.AGENTS.EDIT_MESSAGE,
		(_e, agentId: string, messageId: string, text: string) => {
			const ok = runtime.editMessage(agentId, messageId, text)
			return { ok }
		},
	)

	ipcMain.handle(
		IPC.AGENTS.REGENERATE,
		(_e, agentId: string, fromMessageId: string) => {
			const ok = runtime.regenerate(agentId, fromMessageId)
			return { ok }
		},
	)

	ipcMain.handle(
		IPC.AGENTS.DELETE_MESSAGE,
		(_e, agentId: string, messageId: string) => {
			const ok = runtime.deleteMessage(agentId, messageId)
			return { ok }
		},
	)
}