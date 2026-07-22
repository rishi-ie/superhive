/**
 * `ProjectOverviewSection` — the right sidebar's Overview tab for a
 * project coordinator.
 *
 * Mission-control redesign: six glanceable sections.
 *   1. Project header  (project name + coordinator-authored description)
 *   2. Project health  (status + agent + task stats)
 *   3. Team            (one compact card per assigned agent)
 *   4. Current focus   (project priorities — bullets)
 *   5. Recent activity (chronological feed)
 *   6. Needs attention (action cards the user must resolve)
 *
 * Today the section is mock-driven end-to-end except for the header
 * (project name + description read from the coordinator's truth settings
 * via `coordinatorProjectDescription`). The sub-components take typed
 * props so swapping each mock source for live runtime data is a per-card
 * job.
 */

import * as React from 'react'
import type { Agent } from '@/storage/types'
import { cn } from '@/lib/utils'
import type {
  ProjectOverviewSectionData,
  ProjectHealth,
  AgentOverviewCard,
  AgentOverviewStatus,
  ActivityItem,
  AttentionItem,
} from '@/models/component'
import { ProjectHealthCard } from './overview/ProjectHealthCard'
import { AgentCard } from './overview/AgentCard'
import { CurrentFocusCard } from './overview/CurrentFocusCard'
import { ActivityFeed } from './overview/ActivityFeed'
import { AttentionCard } from './overview/AttentionCard'

interface ProjectOverviewSectionProps {
  data: ProjectOverviewSectionData
}

// Cap matches the truth-side write gate (`update_project_description`
// rejects strings longer than this). Display layer just truncates so the
// right sidebar stays scannable when the coordinator writes a wall of text.
const DESCRIPTION_DISPLAY_MAX_CHARS = 280
const DESCRIPTION_FALLBACK_TEXT =
  'Interact more with the project agent to set a description.'

// ---------------------------------------------------------------------------
// Mock data — replaced by live runtime sources piece-by-piece over time.
// Kept at the top of the file so the orchestrator reads top-to-bottom:
// header (real) → mocks → render.
// ---------------------------------------------------------------------------

const MOCK_HEALTH: ProjectHealth = {
  status: 'healthy',
  agents: 5,
  active: 3,
  idle: 2,
  tasks: 12,
  completed: 8,
  waiting: 1,
}

const MOCK_AGENT_WORK: Record<string, string> = {
  'Architecture Agent': 'Designing reasoning engine',
  'Research Agent': 'Reading HRM papers',
  'Backend Agent': 'Waiting for architecture',
  'Documentation Agent': 'Idle',
}

const MOCK_FOCUS: string[] = [
  'Design latent optimizer',
  'Compare with Transformers',
  'Build mathematical proof',
]

const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: 'a1',
    time: '8m ago',
    text: 'Research Agent summarized HRM paper',
  },
  {
    id: 'a2',
    time: '12m ago',
    text: 'Coordinator assigned Backend Agent',
  },
  {
    id: 'a3',
    time: '26m ago',
    text: 'Architecture Agent updated design document',
  },
  {
    id: 'a4',
    time: '1h ago',
    text: 'Project kickoff — priorities set',
  },
]

const MOCK_ATTENTION: AttentionItem[] = [
  {
    id: 'at1',
    title: 'Review Architecture Draft',
    description: 'Pending approval',
    actionLabel: 'Review',
  },
  {
    id: 'at2',
    title: 'Choose Database',
    description: 'Project blocked until selected',
    actionLabel: 'Answer',
  },
]

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function agentStatusToOverview(status: Agent['status']): AgentOverviewStatus {
  switch (status) {
    case 'active':
    case 'busy':
      return 'active'
    case 'waiting':
      return 'waiting'
    default:
      return 'idle'
  }
}

function memberToAgentCard(member: Agent): AgentOverviewCard {
  const work =
    MOCK_AGENT_WORK[member.name] ??
    member.role ??
    member.description ??
    'Assigned'
  return {
    id: member.id,
    name: member.name,
    status: agentStatusToOverview(member.status),
    work,
  }
}

function truncateForDisplay(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text
  return `${text.slice(0, maxChars - 1).trimEnd()}…`
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function ProjectOverviewSection({ data }: ProjectOverviewSectionProps) {
  const { project, members, coordinatorProjectDescription } = data

  if (!project) {
    return (
      <div className="flex flex-col gap-stack py-button-y">
        <span className="text-sm font-semibold text-foreground">
          Project Overview
        </span>
        <span className="text-xs text-muted-foreground">Project not found.</span>
      </div>
    )
  }

  const teamCards: AgentOverviewCard[] = members.map(memberToAgentCard)

  return (
    <div className={cn('flex flex-col gap-stack py-button-y')}>
      {/* 1. Project Header */}
      <div className="flex flex-col gap-0.5">
        <span className="truncate text-lg font-semibold text-foreground/85">
          {project.name}
        </span>
        {coordinatorProjectDescription ? (
          <span className="text-xs text-muted-foreground line-clamp-2">
            {truncateForDisplay(
              coordinatorProjectDescription,
              DESCRIPTION_DISPLAY_MAX_CHARS,
            )}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/70">
            {DESCRIPTION_FALLBACK_TEXT}
          </span>
        )}
      </div>

      {/* 2. Project Health */}
      <div className="flex flex-col gap-2">
        <SectionLabel>Health</SectionLabel>
        <ProjectHealthCard health={MOCK_HEALTH} />
      </div>

      {/* 3. Team */}
      <div className="flex flex-col gap-2">
        <SectionLabel>Team</SectionLabel>
        {teamCards.length === 0 ? (
          <span className="text-xs text-muted-foreground/70">
            No specialists assigned yet.
          </span>
        ) : (
          <div className="flex flex-col gap-2">
            {teamCards.map((a) => (
              <AgentCard key={a.id} agent={a} />
            ))}
          </div>
        )}
      </div>

      {/* 4. Current Focus */}
      <div className="flex flex-col gap-2">
        <SectionLabel>Current Focus</SectionLabel>
        <CurrentFocusCard items={MOCK_FOCUS} />
      </div>

      {/* 5. Recent Activity */}
      <div className="flex flex-col gap-2">
        <SectionLabel>Recent Activity</SectionLabel>
        <ActivityFeed items={MOCK_ACTIVITY} />
      </div>

      {/* 6. Needs Your Attention */}
      <div className="flex flex-col gap-2">
        <SectionLabel>Needs Your Attention</SectionLabel>
        <div className="flex flex-col gap-2">
          {MOCK_ATTENTION.map((item) => (
            <AttentionCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  )
}
