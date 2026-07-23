/**
 * `SpawnedStaffCard` — Phase G list of agents spawned by the
 * current project coordinator. Renders one row per spawned
 * staff with name, role, and live status. Each row is a
 * button that navigates to the agent's chat when clicked.
 *
 * Reads from `useProjectStaff` (Phase D T-D-5) which returns
 * the agents bound to the project (excluding the coordinator).
 * Live status flows from `useAllAgentStatuses` upstream in
 * the parent — see ProjectSettingsPanel.
 *
 * Empty state: the card hides itself entirely when there are
 * no spawned staff. The Overview section conditionally
 * renders this card so a brand-new project (no spawns yet)
 * shows just the other cards.
 */

import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/ui/icon'
import { CaretRightIcon, RobotIcon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { goToAgent } from '@/flows/navigation'
import type { Agent, AgentStatus, InitStep } from '@/types/electron'

export interface SpawnedStaffCardProps {
	agents: Agent[]
	liveStatuses: Map<string, { status: AgentStatus; bootStep?: InitStep }>
}

function statusDot(status: AgentStatus, booting: boolean, hasError: boolean): { className: string; label: string } {
	if (hasError) return { className: 'bg-destructive', label: 'Error' }
	if (booting) return { className: 'bg-yellow-500 animate-pulse', label: 'Booting' }
	switch (status) {
		case 'active':
		case 'busy':
			return { className: 'bg-emerald-500', label: 'Active' }
		case 'waiting':
			return { className: 'bg-amber-500', label: 'Waiting' }
		case 'idle':
		default:
			return { className: 'bg-muted-foreground/40', label: 'Idle' }
	}
}

export function SpawnedStaffCard({ agents, liveStatuses }: SpawnedStaffCardProps) {
	const navigate = useNavigate()

	if (agents.length === 0) return null

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between">
				<h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					Spawned staff
				</h3>
				<span className="text-[10px] text-muted-foreground/60">
					{agents.length} {agents.length === 1 ? 'agent' : 'agents'}
				</span>
			</div>
			<div className="flex flex-col gap-1.5">
				{agents.map((agent) => {
					const live = liveStatuses.get(agent.id)
					const status = live?.status ?? agent.status
					const booting = status === 'active' && live?.bootStep !== undefined && live.bootStep !== 'ready'
					const hasError = Boolean(agent.lastError)
					const dot = statusDot(status, booting, hasError)
					return (
						<button
							key={agent.id}
							type="button"
							onClick={() => goToAgent(navigate, agent.id)}
							className="group flex h-14 flex-col justify-center rounded-button border border-border bg-card px-3 py-2 text-left transition-colors hover:bg-card/70"
						>
							<div className="flex items-center gap-2">
								<Icon icon={RobotIcon} className="size-3.5 shrink-0 text-muted-foreground" />
								<span className="truncate text-sm font-medium text-foreground/90">
									{agent.name}
								</span>
								<span
									aria-label={dot.label}
									title={dot.label}
									className={cn('ml-auto size-2 shrink-0 rounded-full', dot.className)}
								/>
								<Icon
									icon={CaretRightIcon}
									className="size-3 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground"
								/>
							</div>
							<span className="truncate text-xs text-muted-foreground">
								{agent.role ?? 'generalist'}
							</span>
						</button>
					)
				})}
			</div>
		</div>
	)
}
