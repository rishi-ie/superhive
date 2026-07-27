import { ipcMain } from 'electron'
import type { TurnInput } from '../../src/models/assistant-message'
import { existsSync } from 'node:fs'
import { readFile, writeFile, rename, rm } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { runtime } from '../general-kai-runtime'
import { AgentRepository } from '../../src/storage/repositories/AgentRepository'
import { SettingsRepository } from '../../src/storage/repositories'
import { IPC } from './index'
import { ensureGeneralKai, getGeneralKaiDir } from '../install-general-kai'
import { ensureRuntimePrepared } from '../runtime-provisioner'
import { settingsFilePathFor, type SettingsFile, parseCounter } from '../agent-settings-defaults'
import { manageFilePathFor } from '../agent-settings-defaults'
import { patchCoordinatorForMemberStatus } from '../project-status-mirror'
import { mailboxWatcher } from '../mailbox-watcher'
import { mergeProviders, normalizeRuntimeSettings, type ProviderConfig } from '../provider-merge'

const providerReseeds = new Map<string, Promise<void>>()

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
	merged: Record<string, ProviderConfig>,
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
export function reSeedProviders(agentId: string): Promise<void> {
	const previous = providerReseeds.get(agentId) ?? Promise.resolve()
	const next = previous.catch(() => undefined).then(() => reSeedProvidersOnce(agentId))
	providerReseeds.set(agentId, next)
	void next.then(
		() => { if (providerReseeds.get(agentId) === next) providerReseeds.delete(agentId) },
		() => { if (providerReseeds.get(agentId) === next) providerReseeds.delete(agentId) },
	)
	return next
}

async function reSeedProvidersOnce(agentId: string): Promise<void> {
	const agent = await AgentRepository.getById(agentId)
	if (!agent?.localPath) return
	const agentDir = agent.localPath
	const settingsPath = settingsFilePathFor(agentDir)

	if (!existsSync(settingsPath)) return

	const globalRows = await SettingsRepository.getByOwnerAndGroup(
		'global',
		'global',
		'providers',
	)
	const globalProviders: Record<string, ProviderConfig> = {}
	for (const row of globalRows) {
		globalProviders[row.key] = (row.value as { name?: string; baseUrl?: string | null; apiKey?: string }) ?? {}
	}

	for (let attempt = 0; attempt < 3; attempt++) {
		let current: SettingsFile
		try {
			current = normalizeRuntimeSettings(JSON.parse(await readFile(settingsPath, 'utf8')) as SettingsFile)
		} catch {
			return
		}
		const merged = mergeProviders(globalProviders, current.providers ?? {})
		bootstrapEnvProviders(merged)
		if (Object.keys(merged).length === 0) return

		// Bump the writer counter instead of resetting to #0. Resetting to #0
		// every start/restart breaks the watcher's self-write guard.
		const nextCounter = parseCounter(current.managedBy as string | undefined) + 1
		const next = normalizeRuntimeSettings({
			...current,
			providers: merged,
			managedBy: `superhive-pi-truth@1#${nextCounter}`,
			lastModified: new Date().toISOString(),
		} as SettingsFile)
		const serialized = JSON.stringify(next, null, '\t') + '\n'
		const tmp = `${settingsPath}.${process.pid}.${randomUUID()}.tmp`
		try {
			await writeFile(tmp, serialized, 'utf8')
			await rename(tmp, settingsPath)
			if (await readFile(settingsPath, 'utf8') === serialized) return
		} catch (error) {
			if (attempt === 2) throw error
		} finally {
			await rm(tmp, { force: true }).catch(() => undefined)
		}
	}
	throw new Error(`Failed to persist provider settings for ${agentId}`)
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

async function watchMailbox(agentId: string, agentDir: string): Promise<void> {
	try {
		const raw = await readFile(manageFilePathFor(agentDir), 'utf8')
		const project = (JSON.parse(raw) as { project?: { localPath?: string; coordinatorAgentId?: string } }).project
		mailboxWatcher.watchAgent({
			agentId,
			agentDir,
			projectDir: project?.localPath,
			coordinatorId: project?.coordinatorAgentId === agentId ? agentId : undefined,
		})
	} catch {
		// A standalone or partially migrated agent has no project mailbox to watch.
	}
}

async function waitForRuntimeStop(agentId: string): Promise<void> {
	const deadline = Date.now() + 5_000
	while (runtime.getState(agentId)?.process && Date.now() < deadline) {
		await new Promise((resolve) => setTimeout(resolve, 50))
	}
	if (runtime.getState(agentId)?.process) throw new Error('Agent runtime did not stop within 5 seconds')
}

/** The only supported process-start path. Keep side effects consistent for UI,
 * spawned workers, and task dispatch. */
export async function startManagedAgent(agentId: string): Promise<void> {
	const agent = await AgentRepository.getById(agentId)
	if (!agent?.localPath) throw new Error(`Agent not found or missing localPath: ${agentId}`)
	await ensureRuntimePrepared()
	ensureGeneralKai()
	await autoSeedProviders(agentId, agent.localPath)
	await runtime.start(agentId, agent.localPath, getGeneralKaiDir())
	await watchMailbox(agentId, agent.localPath)

	// Pi has no synchronous ready signal. Wait for its existing ready event rather
	// than marking a failed child process as active immediately.
	const deadline = Date.now() + 10_000
	while (Date.now() < deadline) {
		const entry = runtime.getState(agentId)
		if (!entry?.process) break
		if (runtime.readyEmitted.has(agentId) || entry.bootStep === 'ready') {
			await AgentRepository.update(agentId, { status: 'active', lastError: undefined })
			await patchCoordinatorForMemberStatus(agentId, 'active')
			return
		}
		await new Promise((resolve) => setTimeout(resolve, 50))
	}

	const message = runtime.getState(agentId)?.lastError || 'Agent failed to become ready within 10 seconds'
	runtime.stop(agentId)
	mailboxWatcher.unwatchAgent(agentId)
	await AgentRepository.update(agentId, { status: 'idle', lastError: message })
	await patchCoordinatorForMemberStatus(agentId, 'idle')
	throw new Error(message)
}

export function registerRuntimeIpc(): void {
	ipcMain.handle(IPC.AGENTS.START, async (_e, agentId: string) => {
		await startManagedAgent(agentId)
		return { ok: true }
	})

	ipcMain.handle(IPC.AGENTS.STOP, async (_e, agentId: string) => {
		runtime.stop(agentId)
		mailboxWatcher.unwatchAgent(agentId)
		await AgentRepository.update(agentId, { status: 'idle' })
		// Gap 1: mirror status to coordinator's truth file.
		await patchCoordinatorForMemberStatus(agentId, 'idle')
		return { ok: true }
	})

	ipcMain.handle(IPC.AGENTS.RESTART, async (_e, agentId: string) => {
		runtime.stop(agentId)
		mailboxWatcher.unwatchAgent(agentId)
		await waitForRuntimeStop(agentId)
		await startManagedAgent(agentId)
		return { ok: true }
	})

	ipcMain.handle(IPC.AGENTS.SEND, async (_e, agentId: string, message: TurnInput) => {
		const ok = runtime.send(agentId, message)
		return { ok }
	})

	ipcMain.handle(IPC.AGENTS.GET_RUNTIME_STATE, (_e, agentId: string) => {
		return runtime.getStatusPayload(agentId)
	})
}
