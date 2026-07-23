/**
 * `ProjectOverviewSection` — the right sidebar's Overview tab for a
 * project agent.
 *
 * Mission-control redesign: four glanceable sections.
 *   1. Project header  (project name + agent-authored description)
 *   2. Project health  (status + agent + task stats)
 *   3. Project agent   (ONE card for the project agent — name + status +
 *                       role/description. Replaces the old "Team"
 *                       card which fabricated a list of mock members;
 *                       the project agent IS the project.)
 *   4. Current focus   (project priorities — bullets)
 *   5. Recent activity (chronological feed)
 *
 * The header reads the coordinator's `overview.json` description via
 * `data.coordinatorProjectDescription`. The sub-components take typed
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
} from '@/models/component'
import { ProjectHealthCard } from './overview/ProjectHealthCard'
import { AgentCard } from './overview/AgentCard'
import { CurrentFocusCard } from './overview/CurrentFocusCard'
import { ActivityFeed } from './overview/ActivityFeed'

interface ProjectOverviewSectionProps {
  data: ProjectOverviewSectionData
}

// Display cap for the right-sidebar overview. Prevents a runaway
// description from breaking the header layout.
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

// The "Project agent" card — gap 6 rewrite. The project agent IS the
// project (no coordinator-vs-members plurality). The card shows one
// agent — the project agent itself — with its live status and a brief
// role line. We use the agent's `role`, then `description`, then a
// static fallback so the card always renders something readable.
function projectAgentToCard(coordinator: Agent): AgentOverviewCard {
  const work = coordinator.role ?? coordinator.description ?? 'Project agent'
  return {
    id: coordinator.id,
    name: coordinator.name,
    status: agentStatusToOverview(coordinator.status),
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
  const { project, coordinator, coordinatorProjectDescription } = data

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

  return (
    <div className={cn('flex flex-col gap-6 pt-8 pb-6')}>
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
      <div className="flex flex-col gap-3">
        <SectionLabel>Health</SectionLabel>
        <ProjectHealthCard health={MOCK_HEALTH} />
      </div>

      {/* 3. Project agent — ONE card. Replaces the old "Team" mock list. */}
      <div className="flex flex-col gap-3">
        <SectionLabel>Project agent</SectionLabel>
        {coordinator ? (
          <AgentCard agent={projectAgentToCard(coordinator)} />
        ) : (
          <span className="text-xs text-muted-foreground/70">
            Project agent offline.
          </span>
        )}
      </div>

      {/* 4. Current Focus */}
      <div className="flex flex-col gap-3">
        <SectionLabel>Current Focus</SectionLabel>
        <CurrentFocusCard items={MOCK_FOCUS} />
      </div>

      {/* 5. Recent Activity */}
      <div className="flex flex-col gap-3">
        <SectionLabel>Recent Activity</SectionLabel>
        <ActivityFeed items={MOCK_ACTIVITY} />
      </div>
    </div>
  );
}
