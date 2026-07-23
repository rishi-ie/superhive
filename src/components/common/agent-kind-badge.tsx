/**
 * AgentKindBadge — small visual identifier for an agent's kind.
 *
 * Phase G:
 *   - "Project agent" for project-coordinators
 *   - null for regular agents (the default — no badge)
 *
 * Sized to fit inline next to the agent name in AgentsListView.
 */

import { Badge } from '@/components/ui/badge'
import type { Agent } from '@/types/electron'

export interface AgentKindBadgeProps {
	agentKind: Agent['agentKind']
}

export function AgentKindBadge({ agentKind }: AgentKindBadgeProps) {
	if (agentKind !== 'project-coordinator') return null
	return (
		<Badge
			variant="secondary"
			className="ml-1.5 text-[9px] font-semibold uppercase tracking-wide"
		>
			Project agent
		</Badge>
	)
}
