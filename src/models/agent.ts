/**
 * Agent domain shapes — public surface of `src/flows/agents/`.
 *
 * Per modularity-check.md Step 1, types live in exactly one home. Storage
 * shapes stay in `src/storage/types.ts`; IPC shapes in
 * `src/types/electron.d.ts`; renderer domain shapes here.
 *
 * The CRUD input/result types are the contract for callers. Runtime and
 * settings slice types are the internal data shapes of the per-agent
 * flows. They live here so the flow files can be runtime-only.
 */

import type { Agent, AgentStatus, InitStep, UsageSnapshot, ContextSnapshot, ModelInfo } from '@/types/electron'
import type { RuntimeMessage, CompactionStatus, RetryStatus } from './runtime'

// ---------------------------------------------------------------------------
// CRUD inputs and results
// ---------------------------------------------------------------------------

export interface CreateAgentInput {
  name: string
  folderName: string
  parentDir: string
  role?: string
  description?: string
}

export interface CreateAgentResult {
  ok: boolean
  agent?: Agent
  error?: string
}

export interface CreateProjectAgentInput {
  name: string
  folderName: string
  parentDir: string
  projectId?: string
}

export interface CreateProjectAgentResult {
  ok: boolean
  agent?: Agent
  error?: string
}

export interface PrepareStandaloneAgentInput {
  name: string
  folderName: string
  parentDir: string
  role?: string
  description?: string
}

export type PrepareStandaloneAgentFailure =
  | { ok: false; reason: 'create-failed'; message: string }
  | { ok: false; reason: 'start-failed'; message: string }
  | { ok: false; reason: 'timeout'; detail: 'runtime'; message?: string }
  | { ok: false; reason: 'error'; message: string }

export type PrepareStandaloneAgentResult =
  | { ok: true; agent: Agent }
  | PrepareStandaloneAgentFailure

export interface PrepareProjectAgentInput {
  name: string
  folderName: string
  parentDir: string
  projectId?: string
}

export type PrepareProjectAgentFailure =
  | { ok: false; reason: 'create-failed'; message: string }
  | { ok: false; reason: 'start-failed'; message: string }
  | { ok: false; reason: 'timeout'; detail: 'runtime'; message?: string }
  | { ok: false; reason: 'error'; message: string }

export type PrepareProjectAgentResult =
  | { ok: true; agent: Agent }
  | PrepareProjectAgentFailure

export type WaitForReadyFailure =
  | { ok: false; reason: 'timeout'; detail: 'runtime'; message?: string }
  | { ok: false; reason: 'error'; message: string }

export type WaitForReadyResult =
  | { ok: true; settings: AgentSettingsState }
  | WaitForReadyFailure

export interface WaitForAgentReadyOptions {
  timeoutMs?: number
  pollMs?: number
}

export interface DeleteAgentResult {
  ok: boolean
  error?: string
}

export interface RevealAgentResult {
  ok: boolean
  error?: string
}

export interface UpdateAgentSettingsInput {
  agentId: string
  patch: Partial<AgentSettingsState>
}

// ---------------------------------------------------------------------------
// Settings slice state
// ---------------------------------------------------------------------------

export interface AgentSettingsState {
  name?: string
  description?: string
  model?: { provider: string; name: string }
  systemPrompt?: string
  permissions?: { filesystem?: boolean; terminal?: boolean; network?: boolean }
  runtime?: { thinkingLevel?: string; activeTools?: string[] }
  catalog?: {
    skills?: Array<{ path: string; active: boolean }>
    extensions?: Array<{ path: string; active: boolean }>
    prompts?: Array<{ path: string; active: boolean }>
  }
  sessionsIndex?: {
    sessions: Array<{ id: string; name?: string; messageCount: number; cost: number; path: string }>
  }
  [k: string]: unknown
}

export interface SettingsSlice {
  settings: AgentSettingsState | null
  isLoading: boolean
  error: string | null
  dirty: Record<string, unknown> | null
  unsub: (() => void) | null
  debounceTimer: ReturnType<typeof setTimeout> | null
  listeners: Set<() => void>
}

// ---------------------------------------------------------------------------
// Runtime slice state and live-status shapes
// ---------------------------------------------------------------------------

export interface RuntimeSlice {
  agent: Agent | null
  status: AgentStatus
  messages: RuntimeMessage[]
  lastError?: string
  bootStep?: InitStep
  usage?: UsageSnapshot
  contextUsage?: ContextSnapshot
  availableModels?: ModelInfo[]
  activeModelContextWindow?: number
  activeModelName?: string
  activeModelProvider?: string
  compaction?: CompactionStatus
  retry?: RetryStatus
  inFlightToolCount: number
  loading: boolean
  initialized: boolean
  unsubs: Array<() => void>
  listeners: Set<() => void>
}

export interface AgentLiveState {
  status: AgentStatus
  bootStep?: InitStep
}

// ---------------------------------------------------------------------------
// UI flow state
// ---------------------------------------------------------------------------

export interface OpenCreateAgentState {
  open: boolean
  setOpen: (open: boolean) => void
}
