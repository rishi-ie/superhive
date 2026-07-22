/**
 * Chat persistence — debounced `appendBatch` + `trimTo` over
 * `<agentDir>/chat.jsonl`. Only finalized `ChatRow`s (user + assistant)
 * reach disk. Streaming state lives in the renderer slice, not in the
 * main process.
 *
 * Also houses the **readiness-detection** helpers (`resetSilenceTimer`,
 * `clearSilenceTimer`, `maybeEmitReady`) and the `silenceTimers` /
 * `readyEmitted` Maps. The 2-second output-silence heuristic is a
 * low-level boot signal that conceptually belongs with the
 * process-lifecycle module, but lives here to keep the file count at
 * the approved 6. See commit message for the split rationale.
 */
import log from 'electron-log/main'
import { appendBatch, chatFilePath, trimTo } from '../agent-chat-store'
import { AGENT_CHAT_MESSAGE_CAP } from '../../src/lib/constants'
import type { RuntimeEntry } from '../runtime-status'
import type { GeneralKaiRuntime } from '../general-kai-runtime'
import type { AssistantMessage, ChatRow } from '../../src/models/assistant-message'

const READY_SILENCE_MS = 2000
const CHAT_DEBOUNCE_MS = 1000

export function scheduleChatPersist(rt: GeneralKaiRuntime, entry: RuntimeEntry): void {
  if (entry._chatDebounceTimer) {
    clearTimeout(entry._chatDebounceTimer)
  }
  entry._chatDebounceTimer = setTimeout(() => {
    rt.flushChatEntry(entry)
  }, CHAT_DEBOUNCE_MS)
}

export async function flushChatEntry(_rt: GeneralKaiRuntime, entry: RuntimeEntry): Promise<void> {
  entry._chatDebounceTimer = null
  if (entry._chatPending.size === 0) return
  const rows: ChatRow[] = []
  for (const id of entry._chatPending) {
    const m = entry.messages.find((r) => r.id === id)
    if (m) rows.push(m)
  }
  entry._chatPending.clear()
  if (rows.length === 0) return
  try {
    await appendBatch(chatFilePath(entry.agentDir), rows)
    if (entry.messages.length > AGENT_CHAT_MESSAGE_CAP) {
      trimTo(chatFilePath(entry.agentDir), AGENT_CHAT_MESSAGE_CAP).catch((err) =>
        log.warn(`[runtime] chat trim failed for ${entry.agentId}:`, err),
      )
    }
  } catch (err) {
    log.warn(`[runtime] chat persist failed for ${entry.agentId}:`, err)
  }
}

export async function flushAllChats(rt: GeneralKaiRuntime): Promise<void> {
  await Promise.all(
    Array.from(rt.entries.values()).map((entry) => {
      if (entry._chatDebounceTimer) {
        clearTimeout(entry._chatDebounceTimer)
        entry._chatDebounceTimer = null
      }
      return rt.flushChatEntry(entry)
    }),
  )
}

/**
 * Renderer-driven assistant-message persistence. Fired by the slice's
 * `notify` path on every finalized `AssistantMessage` (via
 * `finalize-message`, `set-frozen`, or `append-error`). Replaces the
 * in-flight placeholder by id, queues the row to `_chatPending`, and
 * schedules the debounced flush to chat.jsonl via `appendBatch`.
 *
 * Idempotent — repeated calls with the same id overwrite the in-memory
 * row (e.g. a retried freeze from the 60s safety net).
 */
export function persistAssistantMessage(
  rt: GeneralKaiRuntime,
  agentId: string,
  message: AssistantMessage,
): void {
  const entry = rt.entries.get(agentId)
  if (!entry) return
  const idx = entry.messages.findIndex((m) => m.id === message.id)
  if (idx === -1) {
    entry.messages = [...entry.messages, message]
  } else {
    entry.messages = [
      ...entry.messages.slice(0, idx),
      message,
      ...entry.messages.slice(idx + 1),
    ]
  }
  entry._chatPending.add(message.id)
  rt.scheduleChatPersist(entry)
}

// ============================================================
// READINESS DETECTION — output-silence heuristic
// ============================================================

export function resetSilenceTimer(rt: GeneralKaiRuntime, entry: RuntimeEntry): void {
  const agentId = entry.agentId
  const existing = rt.silenceTimers.get(agentId)
  if (existing) clearTimeout(existing)
  const timer = setTimeout(() => rt.maybeEmitReady(agentId), READY_SILENCE_MS)
  rt.silenceTimers.set(agentId, timer)
}

export function clearSilenceTimer(rt: GeneralKaiRuntime, agentId: string): void {
  const existing = rt.silenceTimers.get(agentId)
  if (existing) {
    clearTimeout(existing)
    rt.silenceTimers.delete(agentId)
  }
}

export function maybeEmitReady(rt: GeneralKaiRuntime, agentId: string): void {
  rt.silenceTimers.delete(agentId)
  if (rt.readyEmitted.has(agentId)) return
  const entry = rt.entries.get(agentId)
  if (!entry || !entry.process) return
  if (entry.status === 'idle') return
  rt.readyEmitted.add(agentId)
  entry.bootStep = 'ready'
  rt.transitionStatus(entry, 'active')
  log.info(`[runtime] agent ${agentId} ready (silence-based)`)
  rt.emitStatus(agentId)
  rt.emitEvent(agentId, { type: 'boot-step', step: 'ready' })
  rt.emitEvent(agentId, { type: 'ready' })
}
