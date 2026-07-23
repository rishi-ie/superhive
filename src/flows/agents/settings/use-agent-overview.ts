/**
 * useAgentOverview — React flow for `<agentDir>/overview.json`.
 *
 * The right-sidebar Overview tab reads its rendering data from here. The
 * truth ext mirrors `manage.json`'s project.name + project.description
 * into overview.json on every manage write, so consumers don't have to
 * worry about which file holds the canonical "show this in the project
 * header" fields.
 */

import * as React from 'react'
import { agents } from '@/api/agents'
import { toast } from 'sonner'

export type OverviewFileState = Record<string, unknown> | null

interface OverviewSlice {
	state: OverviewFileState
	isLoading: boolean
	error: string | null
	dirty: Record<string, unknown> | null
	debounceTimer: NodeJS.Timeout | null
	listeners: Set<() => void>
}

const slices = new Map<string, OverviewSlice>()
const DEBOUNCE_MS = 500

function ensureSlice(agentId: string): OverviewSlice {
	const existing = slices.get(agentId)
	if (existing) return existing
	const slice: OverviewSlice = {
		state: null,
		isLoading: false,
		error: null,
		dirty: null,
		debounceTimer: null,
		listeners: new Set(),
	}
	slices.set(agentId, slice)
	void reloadOverview(agentId)
	return slice
}

export async function reloadOverview(agentId: string): Promise<void> {
	const slice = slices.get(agentId)
	if (!slice) return
	slice.isLoading = true
	slice.error = null
	try {
		const result = await agents.readOverview(agentId)
		slice.state = (result as OverviewFileState) ?? null
	} catch (err) {
		slice.error = err instanceof Error ? err.message : 'Failed to load overview.json'
		toast.error(slice.error)
	} finally {
		slice.isLoading = false
		slice.listeners.forEach((l) => l())
	}
}

export function useAgentOverview(agentId: string | null) {
	const slice = React.useMemo(() => {
		if (!agentId) return null
		return ensureSlice(agentId)
	}, [agentId])

	const [state, setState] = React.useState<OverviewFileState>(null)
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
		slice.dirty[key] = value
		if (slice.debounceTimer) clearTimeout(slice.debounceTimer)
		slice.debounceTimer = setTimeout(async () => {
			const cur = slices.get(agentId)
			if (!cur || !cur.dirty || Object.keys(cur.dirty).length === 0) return
			const p = cur.dirty
			cur.dirty = null
			cur.debounceTimer = null
			try {
				await agents.writeOverview(agentId, p)
				await reloadOverview(agentId)
			} catch (err) {
				toast.error(err instanceof Error ? err.message : 'Failed to save overview.json')
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
		slice.dirty = null
		if (Object.keys(merged).length === 0) return
		try {
			await agents.writeOverview(agentId, merged)
			await reloadOverview(agentId)
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to save overview.json')
		}
	}, [agentId])

	const reload = React.useCallback(async () => {
		if (!agentId) return
		await reloadOverview(agentId)
	}, [agentId])

	return { settings: state, isLoading, error, patch, flush, reload }
}

export function disposeOverviewSliceNow(agentId: string): void {
	const slice = slices.get(agentId)
	if (!slice) return
	if (slice.debounceTimer) clearTimeout(slice.debounceTimer)
	slices.delete(agentId)
}
