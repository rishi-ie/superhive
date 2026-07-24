/**
 * useAgentManage — React flow for `<agentDir>/manage.json`.
 *
 * Mirror of `useAgentSettings` but targeting the `manage.json` truth file
 * (identity, behavior, permissions, skills/extensions/prompts/packages/
 * themes, planMode, project). Used by the right-sidebar Manage tab —
 * each MANAGE_SECTIONS row's `patch` goes through this hook.
 *
 * Writes are immediate (no debounce). The main process's deep-merge +
 * 3-attempt retry loop handles correctness. Text inputs add a
 * per-component 250ms debounce so rapid typing doesn't trigger one
 * IPC per keystroke.
 */

import * as React from 'react'
import { agents } from '@/api/agents'
import { toast } from 'sonner'

export type ManageFileState = Record<string, unknown> | null

export interface AgentManageSlice {
	state: ManageFileState
	isLoading: boolean
	error: string | null
	listeners: Set<() => void>
}

const slices = new Map<string, AgentManageSlice>()

function ensureSlice(agentId: string): AgentManageSlice {
	const existing = slices.get(agentId)
	if (existing) return existing
	const slice: AgentManageSlice = {
		state: null,
		isLoading: false,
		error: null,
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
		const s = slices.get(agentId)
		if (!s) return
		// Optimistic local state: deep-merge so siblings are preserved.
		if (s.state) {
			s.state = deepMergeDotted(s.state, key, value) as ManageFileState
		}
		s.listeners.forEach((l) => l())
		// Build the top-level partial patch (e.g. "behavior.autoCompaction" ->
		// { behavior: { autoCompaction: false } }). The main process's
		// deep-merge + 3-attempt retry loop handles correctness.
		const partial = deepMergeDotted({}, key, value) as Record<string, unknown>
		void agents
			.writeManage(agentId, partial)
			.then(() => reloadManage(agentId))
			.catch((err: unknown) => {
				toast.error(err instanceof Error ? err.message : 'Failed to save manage.json')
			})
	}, [agentId])

	const reload = React.useCallback(async () => {
		if (!agentId) return
		await reloadManage(agentId)
	}, [agentId])

	return { settings: state, isLoading, error, patch, reload }
}

export function disposeManageSliceNow(agentId: string): void {
	const slice = slices.get(agentId)
	if (!slice) return
	slices.delete(agentId)
}
