/**
 * useProjectStaff — React flow returning the agents bound to a project.
 *
 * Phase D: feeds `deriveProjectHealth` (spawned-side status counts)
 * and the future "Spawned staff" section in Phase G. Today the
 * filtering is client-side: list all agents, filter by
 * `projectIds.includes(projectId)`. The Phase E spawn flow writes
 * the new agent's `projectIds` directly, so the same filter picks
 * it up on the next agents:changed event with no schema changes.
 *
 * Excludes the project agent itself (coordinators have
 * agentKind === 'project-coordinator'; staff are regular agents).
 * Phase E's `agents:spawn-from-template` IPC creates the new agent
 * with `agentKind: undefined` so the filter naturally includes
 * only staff.
 *
 * Lives in `runtime/` (per the Step-2 flow-folder rule that every
 * entity under src/flows/ has the three subfolders). The plan's
 * nominal path was `flows/projects/use-project-staff.ts`; the
 * rubric's stray-file rule takes precedence and we land here
 * alongside the other "live data" hooks (`use-projects-list-version`,
 * `use-project-reconcile-toast`).
 */

import * as React from 'react'
import { listAgents } from '@/flows/agents/crud/list-agents'
import { useAgentsListVersion } from '@/flows/agents/runtime'
import type { Agent } from '@/storage/types'

export interface UseProjectStaffResult {
	staff: Agent[]
	isLoading: boolean
	error: string | null
}

export function useProjectStaff(
	projectId: string | null,
	coordinatorId: string | null,
): UseProjectStaffResult {
	const [staff, setStaff] = React.useState<Agent[]>([])
	const [isLoading, setIsLoading] = React.useState(false)
	const [error, setError] = React.useState<string | null>(null)
	const version = useAgentsListVersion()

	React.useEffect(() => {
		if (!projectId) {
			setStaff([])
			return
		}
		let cancelled = false
		setIsLoading(true)
		setError(null)
		listAgents()
			.then((all) => {
				if (cancelled) return
				const filtered = all.filter(
					(a) =>
						a.id !== coordinatorId &&
						a.agentKind !== 'project-coordinator' &&
						Array.isArray(a.projectIds) &&
						a.projectIds.includes(projectId),
				)
				setStaff(filtered)
			})
			.catch((err: unknown) => {
				if (cancelled) return
				setError(err instanceof Error ? err.message : 'Failed to list agents')
			})
			.finally(() => {
				if (cancelled) return
				setIsLoading(false)
			})
		return () => {
			cancelled = true
		}
	}, [projectId, coordinatorId, version])

	return { staff, isLoading, error }
}
