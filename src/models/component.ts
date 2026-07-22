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
  coordinator: Agent | null
  members: Agent[]
  /**
   * Live project description owned by the coordinator's truth settings
   * (`Superhive-pi-<basename>.json` → `project.description`). The
   * coordinator refreshes this itself via the `update_project_description`
   * truth tool; `null` means the agent hasn't written one yet and the
   * overview tab should render the fallback ("interact more to put a
   * description").
   */
  coordinatorProjectDescription: string | null
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
  settings: AgentSettingsState
  agentId: string
  query?: string
  patch?: (key: string, value: unknown) => void
  flush?: (p: Record<string, unknown>) => Promise<void>
}

export interface ManageSectionDef {
  id: string
  label: string
  description?: string
  Component: ComponentType<SettingsSectionProps>
  getSearchableAtoms: (settings: AgentSettingsState) => SearchableAtom[]
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
