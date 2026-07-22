/**
 * Chat persistence — debounced `appendBatch` + `trimTo` over
 * `<agentDir>/chat.jsonl`.
 *
 * Only finalized `ChatRow`s (user + assistant) reach disk. Streaming
 * state lives in the renderer slice, not in the main process.
 *
 * Scaffold-only stub. Filled in by the runtime split commit.
 */
import type { GeneralKaiRuntime } from '../general-kai-runtime'
import type { AssistantMessage } from '../../src/models/assistant-message'
import type { RuntimeEntry } from '../runtime-status'

export function scheduleChatPersist(_rt: GeneralKaiRuntime, _entry: RuntimeEntry): void {
  throw new Error('not_implemented')
}

export function flushChatEntry(_rt: GeneralKaiRuntime, _entry: RuntimeEntry): Promise<void> {
  throw new Error('not_implemented')
}

export function flushAllChats(_rt: GeneralKaiRuntime): Promise<void> {
  throw new Error('not_implemented')
}

export function persistAssistantMessage(
  _rt: GeneralKaiRuntime,
  _agentId: string,
  _message: AssistantMessage,
): void {
  throw new Error('not_implemented')
}
