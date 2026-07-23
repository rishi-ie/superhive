/**
 * Component-local shapes — public surface of `src/components/`.
 *
 * Per modularity-check.md Step 1, types live in exactly one of three
 * homes. These are renderer domain shapes so they live in `src/models/`.
 * Storage shapes stay in `src/storage/types.ts`; IPC shapes stay in
 * `src/types/electron.d.ts`.
 *
 * Convention: each type is grouped by the component that uses it.
 * Cross-component shapes (e.g. `SettingsSectionProps`, `ManageSectionDef`)
 * are domain-level and live here so the right-sidebar primitives can
 * compose them.
 */

import type { ComponentType } from 'react'
import type { Agent, AgentStatus, Project } from '@/storage/types'
import type { AgentSettingsState } from './agent'

// ---------------------------------------------------------------------------
// Composer
// ---------------------------------------------------------------------------

export type Mode = 'plan' | 'execute' | 'auto'

// ---------------------------------------------------------------------------
// Right sidebar: agent overview
// ---------------------------------------------------------------------------

export interface OverviewPreviousTask {
  name: string
  cost: number
}

export interface OverviewChecklistItem {
  text: string
  done: boolean
}

export interface OverviewChecklist {
  taskName: string
  items: OverviewChecklistItem[]
}

export type ActivityType = 'message' | 'tool' | 'run' | 'edit'

export interface OverviewRecentActivityItem {
  type: ActivityType
  label: string
  timestamp?: string
}

export interface OverviewData {
  name: string
  description: string
  roleSummary?: string
  previousTasks: OverviewPreviousTask[]
  activeChecklist: OverviewChecklist | null
  recentActivity: OverviewRecentActivityItem[]
  responsibilityCount: number
  projects: Project[]
}

// ---------------------------------------------------------------------------
// Right sidebar: project overview
// ---------------------------------------------------------------------------

export interface ProjectOverviewSectionData {
  project: Project | null
  /**
   * The project agent. Gap 6: the project agent IS the project, so this
   * is the only agent referenced by the Overview tab (the old "Team"
   * card fabricated mock members via `members: Agent[]`, which was
   * removed in the same gap). When null the Overview renders a muted
   * "Project agent offline" hint.
   */
  coordinator: Agent | null
  /**
   * Live project description owned by the project agent's
   * `overview.json`. Mirrored there by `superhive-pi-truth` when the
   * agent writes `project.description` via `update_manage`.
   * `null` means the agent hasn't written one yet and the overview tab
   * should render the fallback ("interact more to put a description").
   */
  coordinatorProjectDescription: string | null
  /**
   * Phase D: full content of the project agent's `overview.json`,
   * passed through by ProjectSettingsPanel from `useAgentOverview`.
   * The ProjectOverviewSection reads `focus[]` and `activity[]` from
   * here, replacing the MOCK_FOCUS / MOCK_ACTIVITY constants that lived
   * in the section file pre-Phase-D. The header description is still
   * sourced from `coordinatorProjectDescription` for layout reasons
   * (it's displayed as a single truncated line under the project
   * name; the rest of the overview is not displayed here).
   */
  overview: OverviewFileMirror | null
  /**
   * Phase D: derived health (status + counts) computed by
   * `useProjectHealth` from live runtime state. Replaces MOCK_HEALTH.
   */
  health: ProjectHealth | null
  /**
   * Phase D: project's spawned staff. Used to render the future
   * "Spawned staff" section in Phase G and as input to
   * `deriveProjectHealth` for the spawned-side status counts.
   */
  staff: Agent[]
}

/**
 * Renderer mirror of the truth's `OverviewFile` shape (see
 * superhive-pi-truth/settings-schema.ts). Loose typing so the section
 * can render any subset the agent has populated; missing arrays
 * default to empty in the consumer.
 */
export interface OverviewFileMirror {
  name: string
  description: string
  health?: ProjectHealth
  team?: AgentOverviewCard[]
  focus?: string[]
  activity?: Array<{ id: string; time: string; text: string }>
}

// ---------------------------------------------------------------------------
// Project Overview mission-control sub-components
// ---------------------------------------------------------------------------
//
// The redesign treats the Overview tab as a "Project Mission Control"
// dashboard. Each sub-component is mock-driven today and will swap to live
// runtime data later (truth settings for description/focus, telemetry for
// activity, mailbox for attention). The shapes are local to the renderer
// so swapping sources is a per-component job — no shape leakage into
// storage or IPC layers.

export type ProjectHealthStatus = 'healthy' | 'attention' | 'blocked'

export interface ProjectHealth {
  status: ProjectHealthStatus
  agents: number
  active: number
  idle: number
  tasks: number
  completed: number
  waiting: number
}

export type AgentOverviewStatus = 'active' | 'waiting' | 'idle' | 'error'

export interface AgentOverviewCard {
  id: string
  name: string
  status: AgentOverviewStatus
  /** One short line describing what the agent is currently doing. */
  work: string
}

export interface ActivityItem {
  id: string
  time: string
  text: string
}

// ---------------------------------------------------------------------------
// Right sidebar: settings panels
// ---------------------------------------------------------------------------

export interface SearchableAtom {
  id: string
  label: string
  description?: string
}

export interface SettingsSectionProps {
  /**
   * Loose object so a section can be re-used against either truth file
   * (settings.json for the agent tab, manage.json for the project tab).
   * Sections reach for `settings.<dotted.path>` and tolerate missing keys.
   */
  settings: AgentSettingsState | ManageFileState
  agentId: string
  query?: string
  patch?: (key: string, value: unknown) => void
  flush?: (p: Record<string, unknown>) => Promise<void>
}

export interface ManageSectionDef {
  id: string
  label: string
  description?: string
  /** Coordinator-only gate — section is omitted from the project manage tab when false. */
  coordinatorOnly?: boolean
  Component: ComponentType<SettingsSectionProps>
  getSearchableAtoms: (settings: AgentSettingsState | ManageFileState) => SearchableAtom[]
}

/**
 * Renderer mirror of the truth's `ManageFile` shape. Kept loose (index
 * signature + optional fields) so sections can read whatever they need
 * without locking to schema additions. Mirrors the truth schema in
 * `superhive-pi-truth/settings-schema.ts::ManageFile`.
 */
export interface IdentityBlock {
  name?: string
  description?: string
  workspace?: string
}

export interface ManagePermissionsBlock {
  filesystem?: boolean
  terminal?: boolean
  network?: boolean
}

export interface ManageBehaviorBlock {
  steeringMode?: 'all' | 'one-at-a-time' | 'none'
  followUpMode?: 'all' | 'one-at-a-time' | 'none'
  autoCompaction?: boolean
  autoRetry?: boolean
  compaction?: { enabled?: boolean; reserveTokens?: number; keepRecentTokens?: number }
  branchSummary?: { reserveTokens?: number; skipPrompt?: boolean }
  retry?: { enabled?: boolean; maxRetries?: number; baseDelayMs?: number }
}

export interface ManageProjectBlock {
  id?: string
  name?: string
  description?: string
  coordinatorAgentId?: string
}

export interface ManageFileState {
  identity?: IdentityBlock
  permissions?: ManagePermissionsBlock
  behavior?: ManageBehaviorBlock
  skills?: string[]
  extensions?: string[]
  packages?: unknown[]
  themes?: string[]
  planMode?: {
    defaultMode?: 'plan' | 'build' | 'auto'
    thinkingLevel?: string
    defaultPlanTools?: string[]
    safeSubcommands?: { git?: string[]; gh?: string[] }
  }
  project?: ManageProjectBlock
  /**
   * Catalog list (settings.json-cached) for the skills/extensions/prompts
   * sections. Sections only need this in the project manage tab where
   * the catalog slice sits in settings.json but the active set lives in
   * manage.json. Omitted in the agent tab where they share a single file.
   */
  catalog?: {
    skills?: Array<{ path: string; active?: boolean }>
    extensions?: Array<{ path: string; active?: boolean }>
  }
  [k: string]: unknown
}

// ---------------------------------------------------------------------------
// Right sidebar: inbox row
// ---------------------------------------------------------------------------

export type InboxItemKind = 'approval' | 'question' | 'status'

export type InboxAction =
  | { kind: 'allow'; label: string }
  | { kind: 'deny'; label: string }
  | { kind: 'answer'; label: string; value: string }
  | { kind: 'dismiss' }

export type InboxOutcome =
  | { kind: 'allowed' }
  | { kind: 'denied' }
  | { kind: 'answered'; value: string; label: string }
  | { kind: 'dismissed' }

// ---------------------------------------------------------------------------
// Right sidebar: auto-save hook
// ---------------------------------------------------------------------------

export interface AutoSaveHandle {
  patch: (key: string, value: unknown) => void
  flush: (p: Record<string, unknown>) => Promise<void>
}

// ---------------------------------------------------------------------------
// Common: PreparingToast
// ---------------------------------------------------------------------------

export type PreparingToastVariant = 'loading' | 'error'

export interface PreparingToastAction {
  label: string
  onClick: () => void
}

export interface PreparingToastInput {
  title: string
  description?: string
  variant?: PreparingToastVariant
  actions?: PreparingToastAction[]
}

export interface PreparingToastHandle {
  show: (input: PreparingToastInput) => string
  update: (id: string, patch: Partial<PreparingToastInput>) => void
  dismiss: (id: string) => void
}

// ---------------------------------------------------------------------------
// Common: AgentStatusBadge
// ---------------------------------------------------------------------------

export interface AgentStatusPresentation {
  status: AgentStatus
  /** True when the row carries a `lastError` (idle + lastError renders red). */
  error: boolean
  /** True when the status corresponds to in-progress boot (renders a spinner). */
  booting: boolean
  /** Background class for the dot. */
  dotClass: string
  /** Display label, already taking `error` into account. */
  label: string
}

export interface AgentStatusBadgeProps {
  status: AgentStatus
  /** Set true when the row has a non-empty `lastError`. Swaps dot to destructive red. */
  error?: boolean
  /** Show the spinner overlay (use during boot). */
  booting?: boolean
  /** Tighter gap for sidebar rows. */
  compact?: boolean
  className?: string
}
