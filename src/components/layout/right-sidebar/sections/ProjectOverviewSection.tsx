/**
 * `ProjectOverviewSection` — the right sidebar's Overview tab for a
 * project agent.
 *
 * Mission-control redesign: five glanceable sections.
 *   1. Project header  (project name + agent-authored description)
 *   2. Project health  (status + agent + task stats)
 *   3. Project agent   (ONE card for the project agent — name + status +
 *                       role/description. Replaces the old "Team"
 *                       card which fabricated a list of mock members;
 *                       the project agent IS the project.)
 *   4. Current focus   (project priorities — bullets from overview.json.focus)
 *   5. Recent activity (chronological feed from overview.json.activity)
 *
 * Phase D: MOCK_HEALTH / MOCK_FOCUS / MOCK_ACTIVITY are gone. The
 * section reads the live ProjectOverviewSectionData shape populated
 * by ProjectSettingsPanel: derived `health` from useProjectHealth,
 * `overview.focus[]` and `overview.activity[]` from the project
 * agent's overview.json. Empty arrays render empty-state hints so
 * the user knows the data is "not yet populated" vs "the section
 * is broken".
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import type { AgentLiveState } from '@/models/agent'
import type {
  ProjectOverviewSectionData,
  ProjectHealth,
  ActivityItem,
} from '@/models/component'
import { ProjectHealthCard } from './overview/ProjectHealthCard'
import { CurrentFocusCard } from './overview/CurrentFocusCard'
import { ActivityFeed } from './overview/ActivityFeed'
import { SpawnedStaffCard } from './overview/SpawnedStaffCard'

interface ProjectOverviewSectionProps {
  data: ProjectOverviewSectionData
  /**
   * Live runtime statuses for the spawned staff (and the project
   * agent). Optional — when omitted, the SpawnedStaffCard falls
   * back to each agent's last-known DB status.
   */
  liveStatuses?: Map<string, AgentLiveState>
	liveRuntimeSummary?: string | null
}

// Display cap for the right-sidebar overview. Prevents a runaway
// description from breaking the header layout.
const DESCRIPTION_DISPLAY_MAX_CHARS = 280
const DESCRIPTION_FALLBACK_TEXT =
  'Interact more with the project agent to set a description.'

// Default health when none is provided (e.g. coordinator offline or
// staff list not yet loaded). Mirrors the previous MOCK_HEALTH values
// minus the 5-agent / 12-task counts (those were narrative padding;
// today the truth is "we don't know yet" until the first runtime tick).
const PLACEHOLDER_HEALTH: ProjectHealth = {
  status: 'healthy',
  agents: 0,
  active: 0,
  idle: 0,
  tasks: 0,
  completed: 0,
  waiting: 0,
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

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

// Empty-state hint for sections where the agent hasn't populated data yet.
function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs text-muted-foreground/70 italic">
      {children}
    </span>
  )
}

// Format an ISO timestamp into a "Nm ago / Nh ago / Nd ago" string.
// Returns the input verbatim if it can't be parsed.
function relativeTime(iso: string): string {
	const ms = Date.parse(iso)
	if (Number.isNaN(ms)) return iso
	const delta = Date.now() - ms
	if (delta < 0) return iso
	const minutes = Math.floor(delta / 60_000)
	if (minutes < 1) return 'just now'
	if (minutes < 60) return `${minutes}m ago`
	const hours = Math.floor(minutes / 60)
	if (hours < 24) return `${hours}h ago`
	const days = Math.floor(hours / 24)
	return `${days}d ago`
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function ProjectOverviewSection({ data, liveStatuses, liveRuntimeSummary }: ProjectOverviewSectionProps) {
  const {
    project,
    coordinatorProjectDescription,
    overview,
    health,
    staff,
  } = data

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

  // Normalize the live overview file into the shapes the sub-components
  // expect. The truth ext (superhive-pi-truth) writes focus[]/activity[]
  // as JSON arrays; the agent controls their content via update_overview.
  // Missing fields default to empty arrays so the section renders
  // empty-state hints rather than throwing.
  const focusItems: string[] = Array.isArray(overview?.focus)
    ? (overview!.focus as string[]).filter((s) => typeof s === 'string' && s.length > 0)
    : []
  const activityItems: ActivityItem[] = Array.isArray(overview?.activity)
    ? (overview!.activity as Array<{ id?: unknown; time?: unknown; text?: unknown }>)
        .filter(
          (a): a is { id: string; time: string; text: string } =>
            typeof a?.id === 'string' &&
            typeof a?.text === 'string' &&
            typeof a?.time === 'string',
        )
        .map((a) => ({
          id: a.id,
          time: relativeTime(a.time),
          text: a.text,
        }))
    : []
  const current = overview?.current
  // `active` means the runtime is ready, not that it is responding. Only
  // explicit Pi turn signals may show a live working state here.
  const liveFallback = liveRuntimeSummary
  const workByAgentId = new Map(
    Array.isArray(overview?.team)
      ? overview.team
          .filter((member) => typeof member?.id === 'string' && typeof member?.work === 'string')
          .map((member) => [member.id, member.work] as const)
      : [],
  )

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

      {/* Agent-authored state is durable; the runtime fallback keeps the
            sidebar useful before the first reporting tool call lands. */}
      <div className="flex flex-col gap-2">
        <SectionLabel>Now</SectionLabel>
        {liveFallback ? (
          <div className="rounded-card border border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
            <span className="mr-1.5 inline-block size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {liveFallback}
          </div>
        ) : current?.summary ? (
          <div className="rounded-card border border-border bg-muted/30 px-3 py-2.5">
            <div className="text-xs font-medium capitalize text-foreground/80">Last update: {current.phase}</div>
            <div className="mt-1 text-xs text-muted-foreground">{current.summary}</div>
            {current.updatedAt ? (
              <div className="mt-1.5 text-[11px] text-muted-foreground/70">Updated {relativeTime(current.updatedAt)}</div>
            ) : null}
          </div>
        ) : (
          <EmptyHint>The project agent will describe its current work here.</EmptyHint>
        )}
      </div>

      {/* 2. Project Health — driven by useProjectHealth. Falls back to
            a placeholder shape when no coordinator is online yet
            (so the panel still renders, with agents=0 etc.). */}
      <div className="flex flex-col gap-3">
        <SectionLabel>Health</SectionLabel>
        <ProjectHealthCard health={health ?? PLACEHOLDER_HEALTH} />
      </div>

      {/* 3. Team — excludes the project manager. Renders one card per agent the
            project has spawned via spawn_agent. The card hides itself
            when the list is empty so brand-new projects show just the
            other sections. Live status flows in via the optional
            liveStatuses prop from ProjectSettingsPanel's
            useAllAgentStatuses. */}
      {staff && staff.length > 0 && (
        <SpawnedStaffCard
          agents={staff}
          liveStatuses={liveStatuses ?? new Map()}
		  workByAgentId={workByAgentId}
        />
      )}

      {/* 4. Current Focus — read from overview.json.focus (live). */}
      <div className="flex flex-col gap-3">
        <SectionLabel>Current Focus</SectionLabel>
        {focusItems.length > 0 ? (
          <CurrentFocusCard items={focusItems} />
        ) : (
          <EmptyHint>
            No focus areas yet. The project agent will populate this
            as it reasons.
          </EmptyHint>
        )}
      </div>

      {/* 5. Recent Activity — read from overview.json.activity (live).
            The truth ext records ISO timestamps; we render the relative
            "Nm ago" form here. */}
      <div className="flex flex-col gap-3">
        <SectionLabel>Recent Activity</SectionLabel>
        {activityItems.length > 0 ? (
          <ActivityFeed items={activityItems} />
        ) : (
          <EmptyHint>
            No activity yet. The project agent will log progress as it
            works.
          </EmptyHint>
        )}
      </div>
    </div>
  );
}
