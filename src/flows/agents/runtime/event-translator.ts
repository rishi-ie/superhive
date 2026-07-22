/**
 * Pure translation table: `AdapterEvent` → `StreamOp[]`.
 *
 * This module owns the "event → op" mapping for the runtime pipeline. It is
 * deliberately pure: no IPC calls, no toast, no React state. The caller
 * (`slice.ts`) enqueues the returned ops and then runs any side-effect
 * handlers (refetches, toasts) inline.
 *
 * Why pure:
 *   - Single source of truth for what the queue pipeline ingests per event.
 *   - Easier to read in isolation than the inline switch in `initRuntimeSlice`.
 *   - Easier to edit: add a new event variant by adding one case here.
 *
 * Events that produce ops:
 *   text-start, text-delta, text-end, thinking-start, thinking-delta,
 *   thinking-end, tool-call-start, tool-call-delta, tool-call-end,
 *   tool-execution-start, tool-execution-end, message-start, message-end,
 *   image-attachment, compaction-end (only when result is a non-empty string).
 *
 * Events that produce no ops (handled by slice.ts as side effects):
 *   boot-step, ready, log, error, usage, compaction-start, auto-retry-*,
 *   branch-summary, tool-execution-update (handled inside the tool-result
 *   finalize flow via `_inFlightTools` on the main side; the renderer has no
 *   queue op for partial results — it shows them through `tool-result` part
 *   state transitions instead).
 */

import type { AdapterEvent } from '@/types/electron'
import { normalizeToolResult } from '@/models/runtime'
import type { StreamOp } from './queue'

export function translateEventToOps(
  event: AdapterEvent,
  agentId: string,
): StreamOp[] {
  switch (event.type) {
    case 'text-delta':
      return [
        {
          kind: 'append-delta',
          agentId,
          messageId: event.messageId,
          partType: 'text',
          delta: event.delta,
        },
      ]

    case 'thinking-start':
      return [
        {
          kind: 'append-part',
          agentId,
          messageId: event.messageId,
          part: { type: 'thinking', text: '', state: 'streaming' },
        },
      ]

    case 'thinking-delta':
      return [
        {
          kind: 'append-delta',
          agentId,
          messageId: event.messageId,
          partType: 'thinking',
          delta: event.delta,
        },
      ]

    case 'thinking-end':
      return [
        {
          kind: 'finalize-part',
          agentId,
          messageId: event.messageId,
          partType: 'thinking',
          content: event.content,
        },
      ]

    case 'text-end':
      return [
        {
          kind: 'finalize-part',
          agentId,
          messageId: event.messageId,
          partType: 'text',
          content: event.content,
        },
      ]

    case 'tool-call-start':
      return [
        {
          kind: 'append-part',
          agentId,
          messageId: event.messageId,
          part: {
            type: 'tool-call',
            id: event.toolCallId,
            name: event.name,
            args: undefined,
            state: 'pending',
          },
        },
      ]

    case 'tool-call-delta':
      return [
        {
          kind: 'append-tool-call-delta',
          agentId,
          messageId: event.messageId,
          toolCallId: event.toolCallId,
          delta: event.delta,
        },
      ]

    case 'tool-call-end':
      return [
        {
          kind: 'finalize-tool-call',
          agentId,
          messageId: event.messageId,
          toolCallId: event.toolCallId,
          args: event.args,
        },
      ]

    case 'tool-execution-start':
      return [{ kind: 'increment-inflight', agentId, delta: 1 }]

    case 'tool-execution-end':
      return [
        { kind: 'increment-inflight', agentId, delta: -1 },
        {
          kind: 'finalize-tool-result',
          agentId,
          toolCallId: event.toolCallId,
          result: normalizeToolResult(event.result),
          isError: event.isError,
        },
      ]

    case 'image-attachment':
      return [
        {
          kind: 'append-part',
          agentId,
          messageId: event.messageId,
          // startedAt is required on ContentPart for chronological
          // interleaving. The queue re-stamps it on append-part, but
          // event-translator must include the field to satisfy the
          // ContentPart type.
          part: {
            type: 'image',
            data: event.data,
            mimeType: event.mimeType,
            startedAt: Date.now(),
          },
        },
      ]

    case 'message-start':
      return [
        {
          kind: 'message-start',
          agentId,
          messageId: event.messageId,
          role: event.role,
        },
      ]

    case 'message-end':
      return [
        {
          kind: 'finalize-message',
          agentId,
          messageId: event.messageId,
        },
      ]

    case 'usage': {
      // The `usage` event arrives mid-message-end. Forward it via the
      // finalize-message op's metadata so the freeze step attaches it.
      // We can't mutate the in-flight message's `usage` field from this
      // hook (the slice doesn't track usage on assistant messages
      // directly), so we drop it: the telemetry tailer surfaces usage
      // to the renderer via the status IPC.
      return []
    }

    case 'error': {
      // Translates to an `append-error` op so the timeline gains a
      // warning/error item and the message is frozen without persisting
      // a response. The renderer reads the message id off the slice.
      // Find the latest in-flight assistant message id by looking at
      // the slice; if none, drop.
      // The translator is called with a single event and no slice access,
      // so we look up via the runtime state via main-process callback.
      // For now, the `error` event's `message` becomes a warning timeline
      // item if `recoverable: true`, an error timeline item if false.
      // We don't know which message it belongs to here without context,
      // so the slice routes it inline (see slice.ts).
      return []
    }

    // Compaction-end carries the summary in the event itself; route it through
    // the queue as a `append-compaction-summary` op. The renderer-side queue
    // appends the card to the most recent assistant message. If `result`
    // isn't a non-empty string, drop it (mirrors main's behavior).
    case 'compaction-end':
      if (
        typeof event.result === 'string' &&
        event.result.trim().length > 0
      ) {
        return [
          {
            kind: 'append-compaction-summary',
            agentId,
            summary: event.result,
            tokensBefore: 0,
          },
        ]
      }
      return []

    // Side-effect-only events. `slice.ts` handles these inline (status
    // refetches, toasts, lastError).
    case 'boot-step':
    case 'ready':
    case 'log':
    case 'error':
    case 'usage':
    case 'compaction-start':
    case 'auto-retry-start':
    case 'auto-retry-end':
    case 'text-start':
    case 'branch-summary':
    case 'tool-execution-update':
      return []
  }
}
