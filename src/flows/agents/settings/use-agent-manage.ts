/** One transactional draft for every Manage control on an agent. */
import * as React from 'react'
import { agents } from '@/api/agents'
import { toast } from 'sonner'

export type ManageFileState = Record<string, unknown> | null
type CommitReason = 'send' | 'blur' | 'background'

interface AgentManageSlice {
	persisted: ManageFileState
	draft: ManageFileState
	dirty: Record<string, unknown> | null
	isLoading: boolean
	error: string | null
	pending: Promise<void>
	pendingWrites: number
	debounceTimer: ReturnType<typeof setTimeout> | null
	unsub: (() => void) | null
	listeners: Set<() => void>
}

const AUTO_SAVE_MS = 750
const slices = new Map<string, AgentManageSlice>()

function merge(base: unknown, patch: unknown): Record<string, unknown> {
	const result: Record<string, unknown> = base && typeof base === 'object' && !Array.isArray(base)
		? { ...(base as Record<string, unknown>) } : {}
	if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return result
	for (const [key, value] of Object.entries(patch as Record<string, unknown>)) {
		const prior = result[key]
		result[key] = prior && typeof prior === 'object' && !Array.isArray(prior)
			&& value && typeof value === 'object' && !Array.isArray(value)
			? merge(prior, value) : value
	}
	return result
}

function dottedPatch(path: string, value: unknown): Record<string, unknown> {
	return path.split('.').reverse().reduce<unknown>((child, key) => ({ [key]: child }), value) as Record<string, unknown>
}

function notify(slice: AgentManageSlice): void { slice.listeners.forEach((listener) => listener()) }

function ensureSlice(agentId: string): AgentManageSlice {
	const existing = slices.get(agentId)
	if (existing) return existing
	const slice: AgentManageSlice = {
		persisted: null, draft: null, dirty: null, isLoading: false, error: null,
		pending: Promise.resolve(), pendingWrites: 0, debounceTimer: null, unsub: null, listeners: new Set(),
	}
	slices.set(agentId, slice)
	void refreshAgentManage(agentId)
	slice.unsub = agents.onSettingsChanged(agentId, () => {
		// Never replace an active local draft with an external/cascade revision.
		if (!slice.dirty && slice.pendingWrites === 0) void refreshAgentManage(agentId)
	})
	return slice
}

export async function refreshAgentManage(agentId: string): Promise<void> {
	const slice = slices.get(agentId)
	if (!slice) return
	slice.isLoading = true; slice.error = null; notify(slice)
	try {
		const config = (await agents.readManage(agentId)) as ManageFileState
		slice.persisted = config
		if (!slice.dirty && slice.pendingWrites === 0) slice.draft = config
	} catch (error) {
		slice.error = error instanceof Error ? error.message : 'Failed to load Manage settings'
		toast.error(slice.error)
	} finally { slice.isLoading = false; notify(slice) }
}

function commitSlice(agentId: string, reason: CommitReason): Promise<void> {
	const slice = slices.get(agentId)
	if (!slice || !slice.dirty) return slice?.pending ?? Promise.resolve()
	if (slice.debounceTimer) { clearTimeout(slice.debounceTimer); slice.debounceTimer = null }
	const patch = slice.dirty
	slice.dirty = null
	slice.pendingWrites += 1
	const write = slice.pending.catch(() => undefined).then(async () => {
		const result = await agents.writeManage(agentId, patch)
		slice.persisted = result.config
		// A user may have edited again while this revision was in flight.
		slice.draft = merge(result.config, slice.dirty ?? {})
	}).catch((error: unknown) => {
		slice.error = error instanceof Error ? error.message : `Failed to save Manage settings (${reason})`
		toast.error(slice.error)
		// Restore the failed patch without losing newer edits.
		slice.dirty = merge(patch, slice.dirty ?? {})
		throw error
	}).finally(() => {
		slice.pendingWrites -= 1
		notify(slice)
	})
	slice.pending = write
	notify(slice)
	return write
}

/** Flushes every local revision. This is the correctness boundary before Send. */
export async function flushAgentManage(agentId: string): Promise<void> {
	const slice = slices.get(agentId)
	if (!slice) return
	while (slice.dirty || slice.pendingWrites > 0) {
		if (slice.dirty) void commitSlice(agentId, 'send')
		await slice.pending
	}
}

export function useAgentManage(agentId: string | null) {
	const slice = React.useMemo(() => agentId ? ensureSlice(agentId) : null, [agentId])
	const [, rerender] = React.useState(0)
	React.useEffect(() => {
		if (!slice) return
		const sync = () => rerender((value) => value + 1)
		slice.listeners.add(sync)
		return () => { slice.listeners.delete(sync) }
	}, [slice])

	const updateDraft = React.useCallback((path: string, value: unknown) => {
		if (!agentId) return
		const current = slices.get(agentId)
		if (!current) return
		const patch = dottedPatch(path, value)
		current.draft = merge(current.draft, patch)
		current.dirty = merge(current.dirty, patch)
		current.error = null
		if (current.debounceTimer) clearTimeout(current.debounceTimer)
		current.debounceTimer = setTimeout(() => { void commitSlice(agentId, 'background') }, AUTO_SAVE_MS)
		notify(current)
	}, [agentId])

	const commitDraft = React.useCallback(async (reason: CommitReason = 'blur') => {
		if (!agentId) return
		await commitSlice(agentId, reason)
	}, [agentId])

	return {
		settings: slice?.draft ?? null,
		persisted: slice?.persisted ?? null,
		isLoading: slice?.isLoading ?? false,
		isSaving: (slice?.pendingWrites ?? 0) > 0,
		error: slice?.error ?? null,
		updateDraft,
		commitDraft,
		patch: updateDraft,
		reload: () => agentId ? refreshAgentManage(agentId) : Promise.resolve(),
	}
}

export function disposeManageSliceNow(agentId: string): void {
	const slice = slices.get(agentId)
	if (!slice) return
	if (slice.debounceTimer) clearTimeout(slice.debounceTimer)
	slice.unsub?.()
	slices.delete(agentId)
}
