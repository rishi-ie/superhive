/**
 * Pure helpers around the `RuntimeStatusPayload` IPC contract.
 *
 * Extracted from `general-kai-runtime.ts` so they can be unit-tested without
 * booting Electron — the runtime module's transitive imports pull in
 * `electron`, `lowdb`, and a number of `ipcMain.handle` registrations that
 * are not safe to load under `bun test`.
 *
 * The IPC payload is the boundary where agent state becomes visible to the
 * renderer. Pinning its shape here guards against the regression that
 * dropped `activeModelContextWindow` + `activeModelName` from `emitStatus`,
 * which silently broke the context-window ring for any model whose
 * `contextWindow` was not in Pi's own registry.
 */

import type {
  InitStep,
  UsageSnapshot,
  ContextSnapshot,
  ModelInfo,
  PiProtocolAdapter,
} from './pi-protocol'
import type { AgentStatus } from '../src/storage/types'
import type { RuntimeMessage, RuntimeStatusPayload } from '../src/types/electron'
import type { CompactionStatus, RetryStatus } from '../src/models/runtime'

/**
 * Live runtime state for one agent instance.
 * Single-threaded JS: all mutations are safe without locks.
 *
 * Mirrors the `RuntimeEntry` shape inside `general-kai-runtime.ts`. Kept as
 * its own minimal type here because this file is the canonical reference for
 * what fields the IPC payload reads.
 */
export interface RuntimeEntry {
  agentId: string
  agentDir: string
  manifestPiSource: string
  process: import('node:child_process').ChildProcess | null
  pid?: number
  startedAt?: number
  endedAt?: number
  messages: RuntimeMessage[]
  stderrLog: string[]
  status: AgentStatus
  bootStep?: InitStep
  lastError?: string
  usage?: UsageSnapshot
  contextUsage?: ContextSnapshot
  extensionLoaded: boolean
  availableModels?: ModelInfo[]
  activeModelContextWindow?: number
  activeModelName?: string
  activeModelProvider?: string
  compaction?: CompactionStatus
  retry?: RetryStatus
  _chatPending: Set<string>
  _chatDebounceTimer: ReturnType<typeof setTimeout> | null
  _inFlightTools: Map<string, import('../src/models/runtime').ContentPart & { type: 'tool-result' }>
  adapter: PiProtocolAdapter
}

/**
 * Build the `RuntimeStatusPayload` IPC message from a runtime entry.
 *
 * Must include every field declared on `RuntimeStatusPayload`, especially
 * `activeModelContextWindow` and `activeModelName` — the renderer's
 * context-window fallback chain (AgentChatView / ProjectChatView) relies on
 * these for per-model window updates on every `model_select` event.
 */
export function buildStatusPayload(
  entry: RuntimeEntry,
  agentId: string,
): RuntimeStatusPayload {
  return {
    agentId,
    status: entry.status,
    pid: entry.pid,
    startedAt: entry.startedAt,
    endedAt: entry.endedAt,
    lastError: entry.lastError,
    bootStep: entry.bootStep,
    usage: entry.usage,
    contextUsage: entry.contextUsage,
    availableModels: entry.availableModels,
    activeModelContextWindow: entry.activeModelContextWindow,
    activeModelName: entry.activeModelName,
    activeModelProvider: entry.activeModelProvider,
    compaction: entry.compaction,
    retry: entry.retry,
  }
}