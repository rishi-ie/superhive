/**
 * deriveProjectHealth — pure function computing the project's
 * Overview health card state from runtime signals.
 *
 * Phase C: replaces the MOCK_HEALTH constant in ProjectOverviewSection.
 * Wire via useProjectHealth (T-C-14), which subscribes to live agent
 * statuses and feeds them here.
 *
 * Rules (per PLANS/project-agent-vision.md §2.6):
 *   - status='blocked'  if any spawned agent has status='error'
 *   - status='attention' if project agent idle > IDLE_THRESHOLD_MS
 *                         OR any spawned agent is waiting
 *   - status='healthy'  otherwise
 *
 * Counts:
 *   agents   = spawned.length + 1 (coordinator counted)
 *   active   = count of { status='active' | status='busy' }
 *   idle     = count of { status='idle' }
 *   tasks / completed / waiting  → 0 (TODO until task tooling lands)
 *
 * Pure: same inputs always produce same output. Tested in isolation.
 *
 * Why a wider RuntimeStatus than AgentStatus: AgentStatus is the
 * Agent row's status field ('idle'|'active'|'busy'|'waiting'), but
 * runtime errors are surfaced via Agent.lastError, not the status
 * field. The useProjectHealth hook folds lastError in here so the
 * derivation sees a single 'error' status alongside the canonical
 * AgentStatus values.
 */

import type { AgentStatus } from '@/storage/types'

/** Runtime-emitted status, widens AgentStatus to include 'error'. */
export type RuntimeStatus = AgentStatus | 'error'

export type HealthStatus = 'healthy' | 'attention' | 'blocked'

export interface ProjectHealth {
	status: HealthStatus
	agents: number
	active: number
	idle: number
	tasks: number
	completed: number
	waiting: number
	lastUpdated: string
}

export interface DeriveProjectHealthInput {
	projectAgentStatus: RuntimeStatus | null
	spawnedAgentStatuses: Array<RuntimeStatus | null>
	lastInboxAt: string | null
	now?: number
}

export const IDLE_THRESHOLD_MS = 60 * 60 * 1000 // 1 hour

export function deriveProjectHealth(input: DeriveProjectHealthInput): ProjectHealth {
	const now = input.now ?? Date.now()
	const spawned = input.spawnedAgentStatuses.filter((s): s is RuntimeStatus => s !== null)
	const allStatuses = [input.projectAgentStatus, ...spawned].filter(
		(s): s is RuntimeStatus => s !== null,
	)

	let status: HealthStatus = 'healthy'

	if (spawned.some((s) => s === 'error')) {
		status = 'blocked'
	} else if (
		(input.projectAgentStatus === 'idle' &&
			input.lastInboxAt !== null &&
			now - Date.parse(input.lastInboxAt) > IDLE_THRESHOLD_MS) ||
		spawned.some((s) => s === 'waiting')
	) {
		status = 'attention'
	}

	const active = allStatuses.filter((s) => s === 'active' || s === 'busy').length
	const idle = allStatuses.filter((s) => s === 'idle').length

	return {
		status,
		agents: spawned.length + 1,
		active,
		idle,
		tasks: 0,
		completed: 0,
		waiting: 0,
		lastUpdated: new Date(now).toISOString(),
	}
}

