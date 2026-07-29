/**
 * Chat persistence — debounced `appendBatch` + `trimTo` over
 * `<agentDir>/chat.jsonl`. Only finalized `ChatRow`s (user + assistant)
 * reach disk. Streaming state lives in the renderer slice, not in the
 * main process.
 */
import log from 'electron-log/main'
import { appendBatch, chatFilePath, trimTo } from '../agent-chat-store'
import { AGENT_CHAT_MESSAGE_CAP } from '../../src/lib/constants'
import type { RuntimeEntry } from '../runtime-status'
import type { GeneralKaiRuntime } from '../general-kai-runtime'
import type { AssistantMessage, ChatRow } from '../../src/models/assistant-message'

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
 * `agent-end` or `append-error`). Replaces the
 * in-flight placeholder by id, queues the row to `_chatPending`, and
 * schedules the debounced flush to chat.jsonl via `appendBatch`.
 *
 * Idempotent — repeated calls with the same id overwrite the in-memory
 * row after a retried finalization signal.
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
