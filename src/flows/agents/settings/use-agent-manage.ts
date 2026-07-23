/**
 * useAgentManage — React flow for `<agentDir>/manage.json`.
 *
 * Mirror of `useAgentSettings` but targeting the `manage.json` truth file
 * (identity, behavior, permissions, skills/extensions/prompts/packages/
 * themes, planMode, project). Used by the right-sidebar Manage tab —
 * each MANAGE_SECTIONS row's `patch` and `flush` go through this hook.
 *
 * The flow is intentionally simpler than useAgentSettings: there's no
 * model pick + defaultProvider/defaultModel/enabledModels lockstep. The
 * patch shim just merges any (dotted-key) value into the manage object.
 */

import * as React from 'react'
import { agents } from '@/api/agents'
import { toast } from 'sonner'

export type ManageFileState = Record<string, unknown> | null

export interface AgentManageSlice {
	state: ManageFileState
	isLoading: boolean
	error: string | null
	dirty: Record<string, unknown> | null
	debounceTimer: NodeJS.Timeout | null
	listeners: Set<() => void>
}

const slices = new Map<string, AgentManageSlice>()

const DEBOUNCE_MS = 500

function ensureSlice(agentId: string): AgentManageSlice {
	const existing = slices.get(agentId)
	if (existing) return existing
	const slice: AgentManageSlice = {
		state: null,
		isLoading: false,
		error: null,
		dirty: null,
		debounceTimer: null,
		listeners: new Set(),
	}
	slices.set(agentId, slice)
	void reloadManage(agentId)
	return slice
}

export async function reloadManage(agentId: string): Promise<void> {
	const slice = slices.get(agentId)
	if (!slice) return
	slice.isLoading = true
	slice.error = null
	try {
		const result = await agents.readManage(agentId)
		slice.state = (result as ManageFileState) ?? null
	} catch (err) {
		slice.error = err instanceof Error ? err.message : 'Failed to load manage.json'
		toast.error(slice.error)
	} finally {
		slice.isLoading = false
		slice.listeners.forEach((l) => l())
	}
}

function deepMergeDotted(base: unknown, dottedKey: string, value: unknown): unknown {
	const segments = dottedKey.split('.')
	if (segments.length === 1) {
		return value
	}
	const root: Record<string, unknown> =
		base && typeof base === 'object' && !Array.isArray(base)
			? { ...(base as Record<string, unknown>) }
			: {}
	let cursor: Record<string, unknown> = root
	for (let i = 0; i < segments.length - 1; i++) {
		const seg = segments[i]!
		const existing = cursor[seg]
		const next: Record<string, unknown> =
			existing && typeof existing === 'object' && !Array.isArray(existing)
				? { ...(existing as Record<string, unknown>) }
				: {}
		cursor[seg] = next
		cursor = next
	}
	cursor[segments[segments.length - 1]!] = value
	return root
}

export function useAgentManage(agentId: string | null) {
	const slice = React.useMemo(() => {
		if (!agentId) return null
		return ensureSlice(agentId)
	}, [agentId])

	const [state, setState] = React.useState<ManageFileState>(null)
	const [isLoading, setIsLoading] = React.useState(false)
	const [error, setError] = React.useState<string | null>(null)

	React.useEffect(() => {
		if (!slice) return
		const sync = () => {
			setState(slice.state)
			setIsLoading(slice.isLoading)
			setError(slice.error)
		}
		sync()
		slice.listeners.add(sync)
		return () => {
			slice.listeners.delete(sync)
		}
	}, [slice])

	const patch = React.useCallback((key: string, value: unknown) => {
		if (!agentId) return
		const slice = slices.get(agentId)
		if (!slice) return
		if (!slice.dirty) slice.dirty = {}
		const merged = deepMergeDotted(slice.dirty, key, value)
		// For each top-level sub-key produced by the dotted merge, accumulate
		// into `slice.dirty` (latter writes win, same shape as a JSON Merge
		// Patch caller would build by hand).
		if (merged && typeof merged === 'object' && !Array.isArray(merged)) {
			for (const [k, v] of Object.entries(merged as Record<string, unknown>)) {
				slice.dirty[k] = v
			}
		}
		// Optimistic: deep-merge the patched value into slice.state so
		// controlled inputs (Identity Name, etc.) reflect the new value
		// immediately. Mirrors the optimistic line in useAgentSettings.patch.
		// Without this the input reverts to its pre-typed value on the next
		// React reconciliation and the typed character flickers out.
		if (slice.state) {
			slice.state = deepMergeDotted(slice.state, key, value) as ManageFileState
		}
		if (slice.debounceTimer) clearTimeout(slice.debounceTimer)
		slice.debounceTimer = setTimeout(async () => {
			const cur = slices.get(agentId)
			if (!cur || !cur.dirty || Object.keys(cur.dirty).length === 0) return
			const p = cur.dirty
			cur.dirty = null
			cur.debounceTimer = null
			try {
				await agents.writeManage(agentId, p)
				await reloadManage(agentId)
			} catch (err) {
				toast.error(err instanceof Error ? err.message : 'Failed to save manage.json')
			}
		}, DEBOUNCE_MS)
		slice.listeners.forEach((l) => l())
	}, [agentId])

	const flush = React.useCallback(async (p: Record<string, unknown>) => {
		if (!agentId) return
		const slice = slices.get(agentId)
		if (!slice) return
		if (slice.debounceTimer) {
			clearTimeout(slice.debounceTimer)
			slice.debounceTimer = null
		}
		const merged: Record<string, unknown> = slice.dirty
			? { ...slice.dirty, ...p }
			: { ...p }
		// Optimistic: apply the explicit `p` to slice.state so any controlled
		// inputs wired through this flush reflect the new values immediately.
		// Use the same dotted-key merging as patch.
		if (slice.state) {
			for (const [k, v] of Object.entries(merged)) {
				slice.state = deepMergeDotted(slice.state, k, v) as ManageFileState
			}
		}
		slice.dirty = null
		if (Object.keys(merged).length === 0) return
		try {
			await agents.writeManage(agentId, merged)
			await reloadManage(agentId)
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to save manage.json')
		}
	}, [agentId])

	const reload = React.useCallback(async () => {
		if (!agentId) return
		await reloadManage(agentId)
	}, [agentId])

	return { settings: state, isLoading, error, patch, flush, reload }
}

export function disposeManageSliceNow(agentId: string): void {
	const slice = slices.get(agentId)
	if (!slice) return
	if (slice.debounceTimer) clearTimeout(slice.debounceTimer)
	slices.delete(agentId)
}
