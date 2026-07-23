/**
 * useProjectHealth — React hook that subscribes to live runtime status
 * for a project's coordinator + staff and feeds the data into
 * deriveProjectHealth.
 *
 * Phase C: powers the Overview tab's Health card. Replaces the
 * MOCK_HEALTH constant wired in gap 6.
 *
 * Inputs:
 *   - coordinator: Agent (with status + lastError) for the project lead
 *   - staff:       Agent[] for the project's spawned staff
 *   - inboxItems:  the project's inbox items, used to compute
 *                  lastInboxAt (most recent createdAt). When null,
 *                  the attention rule's idle-duration branch is
 *                  skipped (treats idle as fresh).
 *
 * Status mapping:
 *   - Agent.status is the Agent row's runtime status field
 *     ('idle' | 'active' | 'busy' | 'waiting')
 *   - Agent.lastError is a separate string field — when non-empty,
 *     we fold it into RuntimeStatus as 'error' so the derivation
 *     can detect blocked projects
 *
 * Live vs static: useAllAgentStatuses returns live runtime state
 * that may override the static Agent row's status field. The hook
 * prefers live state when available and falls back to the static
 * Agent row when not. lastError always comes from the static row.
 */

import * as React from 'react'
import { useAllAgentStatuses } from '@/flows/agents/runtime'
import type { Agent } from '@/storage/types'
import {
	deriveProjectHealth,
	type ProjectHealth,
	type RuntimeStatus,
} from './derive-project-health'

export interface UseProjectHealthOpts {
	coordinator: Agent | null
	staff: Agent[]
	inboxItems: Array<{ createdAt?: string | number | null }> | null
}

export function useProjectHealth(opts: UseProjectHealthOpts): ProjectHealth {
	const { coordinator, staff, inboxItems } = opts

	const allIds = React.useMemo(() => {
		const ids: string[] = []
		if (coordinator) ids.push(coordinator.id)
		for (const m of staff) ids.push(m.id)
		return ids
	}, [coordinator, staff])

	const liveStates = useAllAgentStatuses(allIds, allIds.length > 0)

	const runtimeStatusFor = React.useCallback(
		(agent: Agent): RuntimeStatus | null => {
			const live = liveStates.get(agent.id)
			const baseStatus = live?.status ?? agent.status
			if (agent.lastError && agent.lastError.trim().length > 0) {
				return 'error'
			}
			return baseStatus
		},
		[liveStates],
	)

	return React.useMemo<ProjectHealth>(() => {
		const projectAgentStatus = coordinator ? runtimeStatusFor(coordinator) : null
		const spawnedAgentStatuses = staff.map((s) => runtimeStatusFor(s))

		const lastInboxAt = computeLastInboxAt(inboxItems)

		return deriveProjectHealth({
			projectAgentStatus,
			spawnedAgentStatuses,
			lastInboxAt,
		})
	}, [coordinator, staff, inboxItems, runtimeStatusFor])
}

function computeLastInboxAt(
	items: Array<{ createdAt?: string | number | null }> | null,
): string | null {
	if (!items || items.length === 0) return null
	let latest: number | null = null
	for (const item of items) {
		const ts = item.createdAt
		if (ts === undefined || ts === null) continue
		const ms = typeof ts === 'number' ? ts : Date.parse(ts)
		if (Number.isNaN(ms)) continue
		if (latest === null || ms > latest) latest = ms
	}
	return latest === null ? null : new Date(latest).toISOString()
}
