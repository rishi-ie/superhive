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
import type { RuntimeAssistantState, CompactionStatus, RetryStatus } from './runtime'

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
  messages: RuntimeAssistantState[]
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
  /**
   * Renderer-only sentinel set the instant the user sends a message, before
   * any agent event has arrived. Drives the immediate "Working..." placeholder
   * row in the chat. Cleared on the first `message-start` event for the new
   * turn, on any `error` event, or by `pendingTurnTimeoutId` (60s safety net).
   * Not part of the queue pipeline — a pure UI affordance.
   */
  pendingTurn: { userMessageId: string; startedAt: number } | null
  pendingTurnTimeoutId?: ReturnType<typeof setTimeout>
  /**
   * 60s safety-net timer for lineage freeze. Set by `startLineageSafetyNet`
   * when a new in-flight assistant message begins streaming (on
   * `message-start` op). Cleared on `finalize-message` op or when the slice
   * is disposed. If the timer fires, it enqueues a `set-lineage` op to
   * force-freeze the lineage so the renderer can transition state 1 →
   * state 2.
   */
  lineageSafetyNetTimer?: ReturnType<typeof setTimeout>
  /**
   * Set by `useAgentRuntime.send` to the same `startedAt` as `pendingTurn`.
   * Read+cleared by the queue's `message-start` op to set the new assistant
   * message's `ts` to the user-send time.
   */
  lastResponseStart: number | null
  /**
   * Renderer-side dedup set: tracks which assistant messages have already
   * had their frozen lineage IPC'd to the main process for persistence.
   * Without this, every notify would re-emit the IPC and spam chat.jsonl.
   * Entries are added when the IPC fires; entries are never removed (a
   * frozen message stays frozen).
   */
  persistedFrozenLineages: Set<string>
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
