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
import log from 'electron-log/main'
import type { RuntimeStatusPayload } from '../../src/models/runtime'

const providerReseeds = new Map<string, Promise<void>>()
const readinessPromises = new Map<string, Promise<RuntimeStatusPayload>>()
const desiredReadyAgents = new Set<string>()
const START_RETRY_DELAYS_MS = [0, 250, 1_000, 3_000] as const
const READY_TIMEOUT_MS = 10_000
let shuttingDown = false
let supervisorInstalled = false

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

async function startManagedAgentOnce(agentId: string, attempt: number): Promise<RuntimeStatusPayload> {
	const agent = await AgentRepository.getById(agentId)
	if (!agent?.localPath) throw new Error(`Agent not found or missing localPath: ${agentId}`)

	const existing = runtime.getState(agentId)
	if (
		existing?.process &&
		runtime.readyEmitted.has(agentId) &&
		existing.bootStep === 'ready'
	) {
		return runtime.getStatusPayload(agentId)!
	}
	if (existing?.process) {
		runtime.stop(agentId)
		await waitForRuntimeStop(agentId)
	}

	await ensureRuntimePrepared()
	ensureGeneralKai()
	await autoSeedProviders(agentId, agent.localPath)
	await runtime.start(agentId, agent.localPath, getGeneralKaiDir())
	const started = runtime.getState(agentId)
	if (started) {
		started.readiness = 'recovering'
		started.recoveryAttempt = attempt + 1
		runtime.emitStatus(agentId)
	}

	// RawTextAdapter emits ready only after Pi answers the correlated get_state
	// probe written by spawnProcess.
	const deadline = Date.now() + READY_TIMEOUT_MS
	while (Date.now() < deadline) {
		const entry = runtime.getState(agentId)
		if (!entry?.process) break
		if (runtime.readyEmitted.has(agentId) || entry.bootStep === 'ready') {
			await watchMailbox(agentId, agent.localPath)
			await AgentRepository.update(agentId, { status: 'active', lastError: undefined })
			await patchCoordinatorForMemberStatus(agentId, 'active')
			return runtime.getStatusPayload(agentId)!
		}
		await new Promise((resolve) => setTimeout(resolve, 50))
	}

	const message = runtime.getState(agentId)?.lastError || `Agent failed to become ready within ${READY_TIMEOUT_MS / 1000} seconds`
	runtime.stop(agentId)
	mailboxWatcher.unwatchAgent(agentId)
	await waitForRuntimeStop(agentId).catch(() => undefined)
	await AgentRepository.update(agentId, { status: 'idle', lastError: message })
	await patchCoordinatorForMemberStatus(agentId, 'idle')
	throw new Error(message)
}

/** The only supported process-start path. Concurrent callers share one launch. */
export function ensureAgentReady(agentId: string): Promise<RuntimeStatusPayload> {
	desiredReadyAgents.add(agentId)
	const current = runtime.getState(agentId)
	if (
		current?.process &&
		current.bootStep === 'ready' &&
		runtime.readyEmitted.has(agentId)
	) {
		return Promise.resolve(runtime.getStatusPayload(agentId)!)
	}
	const existing = readinessPromises.get(agentId)
	if (existing) return existing

	const pending = (async () => {
		let lastError: unknown
		for (let attempt = 0; attempt < START_RETRY_DELAYS_MS.length; attempt++) {
			const delayMs = START_RETRY_DELAYS_MS[attempt]!
			if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs))
			try {
				return await startManagedAgentOnce(agentId, attempt)
			} catch (error) {
				lastError = error
				log.warn(`[runtime] readiness attempt ${attempt + 1} failed for ${agentId}:`, error)
			}
		}

		const message = lastError instanceof Error ? lastError.message : String(lastError ?? 'Agent failed to start')
		const entry = runtime.getState(agentId)
		if (entry) {
			entry.readiness = 'configuration_error'
			entry.configurationError = {
				code: 'runtime_start_failed',
				message,
				settingsTarget: 'models/providers',
			}
			entry.lastError = message
			entry.recoveryAttempt = START_RETRY_DELAYS_MS.length
			runtime.emitStatus(agentId)
		}
		throw new Error(message)
	})()
	readinessPromises.set(agentId, pending)
	void pending.finally(() => {
		if (readinessPromises.get(agentId) === pending) readinessPromises.delete(agentId)
	}).catch(() => undefined)
	return pending
}

/** Compatibility name for existing task/runtime adapters. */
export async function startManagedAgent(agentId: string): Promise<void> {
	await ensureAgentReady(agentId)
}

export async function warmAllAgents(concurrency = 4): Promise<{
	ready: string[]
	failed: Array<{ agentId: string; error: string }>
}> {
	const agents = (await AgentRepository.getAll()).filter((agent) => Boolean(agent.localPath))
	const ready: string[] = []
	const failed: Array<{ agentId: string; error: string }> = []
	let cursor = 0
	const workers = Array.from({ length: Math.min(concurrency, agents.length) }, async () => {
		while (cursor < agents.length) {
			const agent = agents[cursor++]!
			try {
				await ensureAgentReady(agent.id)
				ready.push(agent.id)
			} catch (error) {
				failed.push({
					agentId: agent.id,
					error: error instanceof Error ? error.message : String(error),
				})
			}
		}
	})
	await Promise.all(workers)
	return { ready, failed }
}

export async function stopAgentForSystemReason(agentId: string): Promise<void> {
	desiredReadyAgents.delete(agentId)
	runtime.stop(agentId)
	mailboxWatcher.unwatchAgent(agentId)
	await waitForRuntimeStop(agentId).catch(() => undefined)
}

export async function suspendAgentForReconfiguration(agentId: string): Promise<void> {
	desiredReadyAgents.delete(agentId)
	await runtime.invalidateForConfigurationChange(agentId)
	mailboxWatcher.unwatchAgent(agentId)
}

export function prepareRuntimeShutdown(): void {
	shuttingDown = true
	desiredReadyAgents.clear()
}

function installRuntimeSupervisor(): void {
	if (supervisorInstalled) return
	supervisorInstalled = true
	runtime.setProcessExitHandler((agentId) => {
		if (
			shuttingDown ||
			!desiredReadyAgents.has(agentId) ||
			readinessPromises.has(agentId)
		) return
		const entry = runtime.getState(agentId)
		if (entry) {
			entry.readiness = 'recovering'
			entry.recoveryAttempt = 0
			runtime.emitStatus(agentId)
		}
		void ensureAgentReady(agentId).catch((error) => {
			log.error(`[runtime] automatic recovery failed for ${agentId}:`, error)
		})
	})
}

export function registerRuntimeIpc(): void {
	installRuntimeSupervisor()

	ipcMain.handle(IPC.AGENTS.START, async (_e, agentId: string) => {
		await ensureAgentReady(agentId)
		return { ok: true }
	})

	ipcMain.handle(IPC.AGENTS.ENSURE_READY, async (_e, agentId: string) => {
		return ensureAgentReady(agentId)
	})

	ipcMain.handle(IPC.AGENTS.STOP, async (_e, agentId: string) => {
		return { ok: runtime.abortTurn(agentId) }
	})

	ipcMain.handle(IPC.AGENTS.ABORT_TURN, async (_e, agentId: string) => {
		return { ok: runtime.abortTurn(agentId) }
	})

	ipcMain.handle(IPC.AGENTS.RESTART, async (_e, agentId: string) => {
		await suspendAgentForReconfiguration(agentId)
		await ensureAgentReady(agentId)
		return { ok: true }
	})

	ipcMain.handle(IPC.AGENTS.SEND, async (_e, agentId: string, message: TurnInput) => {
		await ensureAgentReady(agentId)
		const ok = runtime.send(agentId, message)
		return { ok }
	})

	ipcMain.handle(IPC.AGENTS.GET_RUNTIME_STATE, (_e, agentId: string) => {
		return runtime.getStatusPayload(agentId)
	})
}
