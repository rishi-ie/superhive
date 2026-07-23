/**
 * useAgentInbox — React flow for `<agentDir>/inbox.json`.
 *
 * The right-sidebar Inbox tab reads its data from here. Agents append
 * items via the truth tool `append_inbox` (which the orchestrator can
 * also drive through a flow on the main process). The flow surfaces
 * `append`, `markRead`, and `clear` mutators and `reload`.
 */

import * as React from 'react'
import { agents } from '@/api/agents'
import { toast } from 'sonner'

export interface InboxItemRaw {
	id: string
	kind: string
	severity?: string
	message: string
	payload?: Record<string, unknown>
	status: string
	createdAt: string
	updatedAt?: string
	answeredWith?: unknown
}

export interface InboxState {
	items: InboxItemRaw[]
}

interface InboxSlice {
	state: InboxState
	isLoading: boolean
	error: string | null
	listeners: Set<() => void>
}

const slices = new Map<string, InboxSlice>()

function ensureSlice(agentId: string): InboxSlice {
	const existing = slices.get(agentId)
	if (existing) return existing
	const slice: InboxSlice = {
		state: { items: [] },
		isLoading: false,
		error: null,
		listeners: new Set(),
	}
	slices.set(agentId, slice)
	void reloadInbox(agentId)
	return slice
}

export async function reloadInbox(agentId: string): Promise<void> {
	const slice = slices.get(agentId)
	if (!slice) return
	slice.isLoading = true
	slice.error = null
	try {
		const result = await agents.readInboxJson(agentId)
		const items = (result?.items ?? []) as InboxItemRaw[]
		slice.state = { items }
	} catch (err) {
		slice.error = err instanceof Error ? err.message : 'Failed to load inbox.json'
		toast.error(slice.error)
	} finally {
		slice.isLoading = false
		slice.listeners.forEach((l) => l())
	}
}

export function useAgentInbox(agentId: string | null) {
	const slice = React.useMemo(() => {
		if (!agentId) return null
		return ensureSlice(agentId)
	}, [agentId])

	const [state, setState] = React.useState<InboxState>({ items: [] })
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

	const reload = React.useCallback(async () => {
		if (!agentId) return
		await reloadInbox(agentId)
	}, [agentId])

	const append = React.useCallback(
		async (input: {
			kind: 'notification' | 'permission' | 'question'
			message: string
			severity?: 'info' | 'warning' | 'error'
			payload?: Record<string, unknown>
		}) => {
			if (!agentId) return null
			try {
				const result = await agents.appendInbox(agentId, input)
				await reloadInbox(agentId)
				return result.id
			} catch (err) {
				toast.error(err instanceof Error ? err.message : 'Failed to append inbox item')
				return null
			}
		},
		[agentId],
	)

	const markRead = React.useCallback(
		async (inboxId: string, answeredWith?: unknown) => {
			if (!agentId) return
			try {
				await agents.markInboxRead(agentId, inboxId, answeredWith)
				await reloadInbox(agentId)
			} catch (err) {
				toast.error(err instanceof Error ? err.message : 'Failed to mark inbox item')
			}
		},
		[agentId],
	)

	const clear = React.useCallback(
		async (status?: 'pending' | 'read' | 'answered' | 'dismissed') => {
			if (!agentId) return
			try {
				await agents.clearInbox(agentId, status)
				await reloadInbox(agentId)
			} catch (err) {
				toast.error(err instanceof Error ? err.message : 'Failed to clear inbox')
			}
		},
		[agentId],
	)

	return { items: state.items, isLoading, error, reload, append, markRead, clear }
}

export function disposeInboxSliceNow(agentId: string): void {
	const slice = slices.get(agentId)
	if (!slice) return
	slices.delete(agentId)
}
