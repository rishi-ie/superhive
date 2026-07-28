/**
 * Per-agent stream queue — the data pipeline between the IPC event stream
 * and the renderer's runtime slice.
 *
 * Phase BD scope:
 *   - The queue mutates `slice.inFlight` for every streaming op. `inFlight`
 *     is a `RuntimeAssistantState` with three coordinated surfaces:
 *     `parts` (internal mutation target — never persisted), `activityTimeline`
 *     (the chain metadata), and `response` (the assistant prose).
 *   - `slice.messages: ChatRow[]` grows at `agent-end` (or an explicit error).
 *     It contains finalized rows only.
 *   - `freezeAssistantState` + `buildAssistantMessage` are the two-step
 *     converter from in-flight → persisted. Called by the slice's notify
 *     path when `inFlight.frozen` becomes true.
 *   - `set-messages` is a simple merge by id — the main process is a pure
 *     forwarder, so it never sends streaming state.
 *
 * Architecture:
 *   IPC event → event-translator → enqueue(op) → tick (50ms) → applyOp(slice) → notify → persist
 */

import type {
  ContentPart,
  MessageUsage,
  RuntimeAssistantState,
  RuntimeSliceView,
  StreamOp,
  AccessorFn,
} from '@/models/runtime'
import type {
  AssistantMessage,
  AssistantMessageMetadata,
  ChatRow,
  ErrorTimelineItem,
  ResponseBlock,
  ThinkingTimelineItem,
  TimelineItem,
  ToolCallTimelineItem,
  WarningTimelineItem,
} from '@/models/assistant-message'
import { AGENT_CHAT_MESSAGE_CAP } from '@/lib/constants'

export type { StreamOp, RuntimeSliceView, SliceAccessor, AccessorFn } from '@/models/runtime'

export const QUEUE_TICK_MS = 50
const MAX_QUEUE_SIZE = 1000
/** Cap matches disk trim (AGENT_CHAT_MESSAGE_CAP). Drop oldest rows beyond this. */
export const MAX_QUEUE_MESSAGES = AGENT_CHAT_MESSAGE_CAP

let sliceAccessor: AccessorFn | null = null

export function setSliceAccessor(fn: AccessorFn): void {
  sliceAccessor = fn
}

const queues = new Map<string, StreamOp[]>()
let timer: ReturnType<typeof setInterval> | null = null

export function enqueue(op: StreamOp): void {
  const q = queues.get(op.agentId)
  if (q) {
    if (q.length >= MAX_QUEUE_SIZE) {
      // eslint-disable-next-line no-console
      console.warn(
        `[agent-stream-queue] queue for ${op.agentId} capped at ${MAX_QUEUE_SIZE}; dropping oldest op`,
      )
      q.shift()
    }
    q.push(op)
    return
  }
  queues.set(op.agentId, [op])
  ensureTimer()
}

function ensureTimer(): void {
  if (timer === null) timer = setInterval(tick, QUEUE_TICK_MS)
}

export function clearAgentQueue(agentId: string): void {
  queues.delete(agentId)
}

export function clearAll(): void {
  queues.clear()
  if (timer !== null) {
    clearInterval(timer)
    timer = null
  }
}

export function pendingOpsCount(agentId: string): number {
  return queues.get(agentId)?.length ?? 0
}

export function _test_drainNow(): void {
  tick()
}

function tick(): void {
  if (queues.size === 0) {
    clearAll()
    return
  }
  for (const [agentId, ops] of queues) {
    const accessor = sliceAccessor?.(agentId)
    if (!accessor) {
      queues.delete(agentId)
      continue
    }
    for (const op of ops) applyOp(accessor.slice, op)
    accessor.notify()
  }
  queues.clear()
}

// ---------------------------------------------------------------------------
// Freeze + build — the one-shot bridge from in-flight to persisted shape
// ---------------------------------------------------------------------------

/**
 * Force-freeze a `RuntimeAssistantState`:
 *   - idempotent (returns same state if already frozen),
 *   - force-flips every in-flight thinking / tool-call / text / response
 *     block to `complete`,
 *   - computes `totalDurationMs`,
 *   - sets `frozen: true`.
 *
 * Note: we deliberately do NOT append a `CompletionTimelineItem`. The
 * finished-marker lives at the top of the message (the `Indicator`
 * component) — having a second "Completed" row at the end of the
 * timeline is redundant and clutters the lineage. The type still exists
 * for forward compat with on-disk messages written before this change;
 * see `group-timeline-items.ts` which filters them.
 *
 * Pure — does not mutate the input. The slice applies the returned state.
 */
export function freezeAssistantState(
  state: RuntimeAssistantState,
  extras: {
    model?: { provider: string; name: string }
    usage?: MessageUsage
  } = {},
): RuntimeAssistantState {
  if (state.frozen) return state

  const endedAt = Date.now()
  const totalDurationMs = endedAt - state.ts

  const activityTimeline: TimelineItem[] = state.activityTimeline.map((item) => {
    if (item.kind === 'thinking') {
      if (item.state === 'streaming') {
        return { ...item, state: 'complete', endedAt }
      }
      return item.endedAt === 0 ? { ...item, endedAt } : item
    }
    if (item.kind === 'tool-call') {
      if (item.state !== 'complete' && item.state !== 'error') {
        return { ...item, state: 'complete', endedAt }
      }
      return item.endedAt === null ? { ...item, endedAt } : item
    }
    return item
  })

  const response: ResponseBlock[] = state.response.map((block) => {
    if (block.type === 'text' && block.state === 'streaming') {
      return { ...block, state: 'complete' }
    }
    return block
  })

  const metadata: AssistantMessageMetadata = {}
  if (extras.usage) metadata.usage = extras.usage
  if (extras.model) metadata.model = extras.model
  metadata.totalDurationMs = totalDurationMs

  return {
    ...state,
    activityTimeline,
    response,
    frozen: true,
    totalDurationMs,
    usage: extras.usage ?? state.usage,
  }
}

/**
 * Convert a frozen `RuntimeAssistantState` into the persisted
 * `AssistantMessage` shape. Throws if the state is not frozen.
 */
export function buildAssistantMessage(state: RuntimeAssistantState): AssistantMessage {
  if (!state.frozen) {
    throw new Error(
      `[buildAssistantMessage] state ${state.id} is not frozen — call freezeAssistantState first`,
    )
  }
  const metadata: AssistantMessageMetadata = {}
  if (state.usage) metadata.usage = state.usage
  if (state.totalDurationMs !== undefined) metadata.totalDurationMs = state.totalDurationMs

  return {
    id: state.id,
    role: 'assistant',
    timestamp: state.ts,
    activityTimeline: state.activityTimeline,
    response: state.response,
    metadata,
  }
}

// ---------------------------------------------------------------------------
// Pure helpers for queue ops
// ---------------------------------------------------------------------------

function withInFlight(
  slice: RuntimeSliceView,
  messageId: string,
  mutator: (state: RuntimeAssistantState) => RuntimeAssistantState | null,
): boolean {
  if (!slice.inFlight || slice.inFlight.sourceMessageId !== messageId) return false
  const next = mutator(slice.inFlight)
  if (next === null) return false
  slice.inFlight = next
  return true
}

function appendThinkingTimelineItem(
  state: RuntimeAssistantState,
  startedAt: number,
  sequence: number,
): ThinkingTimelineItem {
  return {
    kind: 'thinking',
    id: `thinking-${startedAt}-${state.activityTimeline.length}`,
    text: '',
    state: 'streaming',
    startedAt,
    endedAt: 0,
    sequence,
  }
}

function appendToolCallTimelineItem(
  _state: RuntimeAssistantState,
  startedAt: number,
  sequence: number,
  toolCallId: string,
  toolName: string,
): ToolCallTimelineItem {
  return {
    kind: 'tool-call',
    id: `toolcall-${toolCallId}`,
    toolName,
    state: 'pending',
    startedAt,
    endedAt: null,
    sequence,
  }
}

/** Keep the activity UI useful without persisting raw tool arguments. */
function getToolTarget(toolName: string, args: unknown): string | undefined {
  if (!args || typeof args !== 'object') return undefined
  const value = (key: string) => {
    const candidate = (args as Record<string, unknown>)[key]
    return typeof candidate === 'string' && candidate.trim() ? candidate.trim() : undefined
  }
  const target =
    toolName === 'bash'
      ? value('command')
      : toolName === 'grep' || toolName === 'find'
        ? value('pattern') ?? value('query')
        : toolName === 'web_search' || toolName === 'fetch'
          ? value('query') ?? value('searchQuery') ?? value('url')
          : toolName === 'set_project_current_work'
            ? value('summary')
            : value('path')
  return target ? target.replace(/\s+/g, ' ').slice(0, 120) : undefined
}

// ---------------------------------------------------------------------------
// applyOp — the per-op dispatcher
// ---------------------------------------------------------------------------

function applyOp(slice: RuntimeSliceView, op: StreamOp): void {
  switch (op.kind) {
    case 'message-start': {
      // Pi can emit several assistant messages around tool calls. They are
      // one user-visible response run, so only the source-message id changes.
      if (slice.inFlight && !slice.inFlight.frozen) {
        slice.inFlight = { ...slice.inFlight, sourceMessageId: op.messageId }
        return
      }
      if (slice.messages.some((m) => m.id === op.messageId)) return
      const startedAt = Date.now()
      slice.lastResponseStart = null
      slice.inFlight = {
        id: op.messageId,
        role: op.role,
        sourceMessageId: op.messageId,
        nextSequence: 0,
        ts: startedAt,
        parts: [],
        activityTimeline: [],
        response: [],
      }
      // Flip the "agent is mid-response" sentinel. Holds the chat
      // footer (copy + timestamp + usage) until `agent-end` clears
      // it. Per-turn `message-end`s leave this true because more
      // turns may still arrive.
      if (op.role === 'assistant') {
        slice.agentResponseActive = true
      }
      return
    }

    case 'append-part': {
      withInFlight(slice, op.messageId, (state) => {
        const now = Date.now()
        // For part types that flow into ResponseBlock, attach startedAt so the
        // renderer can interleave timeline items and prose chronologically.
        // event-translator doesn't know `now` (it lives in queue time), so the
        // queue stamps it here before mirroring into parts[] + response[].
        let part = op.part
        if (
          part.type === 'text' ||
          part.type === 'image' ||
          part.type === 'compaction-summary'
        ) {
          part = { ...part, startedAt: now }
        }
        const parts = [...state.parts, part]
        let activityTimeline = state.activityTimeline
        let response = state.response
        const sequence = state.nextSequence
        let nextSequence = sequence

        if (op.part.type === 'thinking') {
          activityTimeline = [...activityTimeline, appendThinkingTimelineItem(state, now, sequence)]
          nextSequence++
        } else if (op.part.type === 'tool-call') {
          activityTimeline = [
            ...activityTimeline,
            appendToolCallTimelineItem(state, now, sequence, op.part.id, op.part.name),
          ]
          nextSequence++
        } else if (op.part.type === 'text') {
          response = [
            ...response,
            {
              type: 'text',
              text: op.part.text,
              state: op.part.state ?? 'streaming',
              startedAt: now,
              sequence,
            },
          ]
          nextSequence++
        } else if (op.part.type === 'image') {
          response = [
            ...response,
            {
              type: 'image',
              data: op.part.data,
              mimeType: op.part.mimeType,
              startedAt: now,
              sequence,
            },
          ]
          nextSequence++
        } else if (op.part.type === 'compaction-summary') {
          response = [
            ...response,
            {
              type: 'compaction-summary',
              tokensBefore: op.part.tokensBefore,
              summary: op.part.summary,
              startedAt: now,
              sequence,
            },
          ]
          nextSequence++
        }
        return { ...state, parts, activityTimeline, response, nextSequence }
      })
      return
    }

    case 'append-delta': {
      withInFlight(slice, op.messageId, (state) => {
        const parts = [...state.parts]
        const activityTimeline = [...state.activityTimeline]
        const response = [...state.response]
        let nextSequence = state.nextSequence

        if (op.partType === 'text') {
          const last = response[response.length - 1]
          const lastPart = parts[parts.length - 1]
          const continuesText = lastPart?.type === 'text'
          if (continuesText && last && last.type === 'text') {
            // Extend the trailing text block. Spread preserves startedAt —
            // subsequent deltas don't shift the block's position in the
            // chronological order.
            response[response.length - 1] = {
              ...last,
              text: last.text + op.delta,
              state: 'streaming',
            }
          } else {
            // First delta of a new text block — stamp it with `now`. This
            // is the block's birth time for chronological interleaving.
            response.push({
              type: 'text',
              text: op.delta,
              state: 'streaming',
              startedAt: Date.now(),
              sequence: nextSequence++,
            })
          }
          // Mirror into parts[] — same rule.
          if (continuesText && lastPart?.type === 'text') {
            parts[parts.length - 1] = {
              ...lastPart,
              text: lastPart.text + op.delta,
              state: 'streaming',
            }
          } else {
            parts.push({
              type: 'text',
              text: op.delta,
              state: 'streaming',
              startedAt: Date.now(),
            })
          }
        } else {
          // thinking — extend trailing thinking part AND trailing thinking timeline item
          const lastPart = parts[parts.length - 1]
          if (lastPart && lastPart.type === 'thinking') {
            parts[parts.length - 1] = {
              ...lastPart,
              text: lastPart.text + op.delta,
              state: 'streaming',
            }
          } else {
            parts.push({ type: 'thinking', text: op.delta, state: 'streaming' })
          }
          const lastTimeline = activityTimeline[activityTimeline.length - 1]
          if (lastTimeline && lastTimeline.kind === 'thinking') {
            activityTimeline[activityTimeline.length - 1] = {
              ...lastTimeline,
              text: lastTimeline.text + op.delta,
              state: 'streaming',
            }
          } else {
            const fresh = appendThinkingTimelineItem(state, Date.now(), nextSequence++)
            fresh.text = op.delta
            activityTimeline.push(fresh)
          }
        }
        return { ...state, parts, activityTimeline, response, nextSequence }
      })
      return
    }

    case 'append-tool-call-delta': {
      withInFlight(slice, op.messageId, (state) => {
        const parts = state.parts.map((p) => {
          if (p.type === 'tool-call' && p.id === op.toolCallId) {
            const prevArgs = typeof p.args === 'string' ? p.args : ''
            return { ...p, args: prevArgs + op.delta, state: 'streaming-args' as const }
          }
          return p
        })
        const activityTimeline = state.activityTimeline.map((item) => {
          if (item.kind === 'tool-call' && item.id === `toolcall-${op.toolCallId}`) {
            return { ...item, state: 'streaming-args' as const }
          }
          return item
        })
        return { ...state, parts, activityTimeline }
      })
      return
    }

    case 'append-activity-summary': {
      withInFlight(slice, op.messageId, (state) => {
        const now = Date.now()
        return {
          ...state,
          activityTimeline: [
            ...state.activityTimeline,
            {
              kind: 'planning' as const,
              id: `planning-${now}-${state.activityTimeline.length}`,
              summary: op.summary.slice(0, 160),
              startedAt: now,
              endedAt: now,
              sequence: state.nextSequence,
            },
          ],
          nextSequence: state.nextSequence + 1,
        }
      })
      return
    }

    case 'finalize-part': {
      withInFlight(slice, op.messageId, (state) => {
        const now = Date.now()
        const parts = state.parts.map((p) => {
          if (p.type !== op.partType || p.state === 'complete') return p
          return { ...p, text: op.content ?? p.text, state: 'complete' as const }
        })
        const response = state.response.map((block) => {
          if (op.partType === 'text' && block.type === 'text' && block.state === 'streaming') {
            return {
              ...block,
              text: op.content ?? block.text,
              state: 'complete' as const,
            }
          }
          return block
        })
        const activityTimeline =
          op.partType === 'thinking'
            ? state.activityTimeline.map((item) => {
                if (item.kind === 'thinking' && item.state === 'streaming') {
                  return { ...item, state: 'complete' as const, endedAt: now }
                }
                return item
              })
            : state.activityTimeline
        return { ...state, parts, response, activityTimeline }
      })
      return
    }

    case 'finalize-tool-call': {
      withInFlight(slice, op.messageId, (state) => {
        const parts = state.parts.map((p) => {
          if (p.type === 'tool-call' && p.id === op.toolCallId) {
            return { ...p, args: op.args, state: 'complete' as const }
          }
          return p
        })
        const activityTimeline = state.activityTimeline.map((item) => {
          if (item.kind === 'tool-call' && item.id === `toolcall-${op.toolCallId}`) {
            // The model finished producing arguments; the host may still be executing.
            return {
              ...item,
              toolName: op.name || item.toolName,
              target: getToolTarget(op.name || item.toolName, op.args),
              state: item.state === 'running' ? 'running' as const : 'pending' as const,
              endedAt: null,
            }
          }
          return item
        })
        return { ...state, parts, activityTimeline }
      })
      return
    }

    case 'start-tool-execution': {
      if (!slice.inFlight) return
      const parts = slice.inFlight.parts.map((part) =>
        part.type === 'tool-call' && part.id === op.toolCallId
          ? { ...part, args: op.args, state: 'running' as const }
          : part,
      )
      const activityTimeline = slice.inFlight.activityTimeline.map((item) =>
        item.kind === 'tool-call' && item.id === `toolcall-${op.toolCallId}`
          ? {
              ...item,
              toolName: op.name || item.toolName,
              target: getToolTarget(op.name || item.toolName, op.args),
              state: 'running' as const,
              endedAt: null,
            }
          : item,
      )
      slice.inFlight = { ...slice.inFlight, parts, activityTimeline }
      return
    }

    case 'finalize-tool-result': {
      // Keep the raw result in parts and its normalized form on the activity
      // row. The UI reveals that row only when the frozen State 2 trace opens.
      // `finalize-tool-result` carries no `messageId`; the in-flight
      // assistant message is the only place tool-results can land.
      if (!slice.inFlight) return
      const toolCallId = op.toolCallId
      let parts = slice.inFlight.parts.map((part) =>
        part.type === 'tool-call' && part.id === toolCallId
          ? { ...part, state: op.isError ? 'error' as const : 'complete' as const }
          : part,
      )
      const toolResultPart: ContentPart = {
        type: 'tool-result',
        id: toolCallId,
        name: '',
        result: op.result,
        isError: op.isError,
        state: 'complete',
      }
      const existingResultIdx = parts.findIndex(
        (p) => p.type === 'tool-result' && p.id === toolCallId,
      )
      if (existingResultIdx >= 0) {
        parts[existingResultIdx] = toolResultPart
      } else {
        const toolCallIdx = parts.findIndex(
          (p) => p.type === 'tool-call' && p.id === toolCallId,
        )
        if (toolCallIdx === -1) return
        parts.splice(toolCallIdx + 1, 0, toolResultPart)
      }
      const activityTimeline = slice.inFlight.activityTimeline.map((item) =>
        item.kind === 'tool-call' && item.id === `toolcall-${toolCallId}`
          ? {
              ...item,
              toolName: op.name || item.toolName,
              state: op.isError ? 'error' as const : 'complete' as const,
              endedAt: Date.now(),
              ...(op.isError ? { error: 'Tool execution failed' } : {}),
              result: op.result,
            }
          : item,
      )
      slice.inFlight = { ...slice.inFlight, parts, activityTimeline }
      return
    }

    case 'finalize-message': {
      // This ends a Pi sub-turn, not the user's response. Keep the run alive
      // until the adapter reports `agent-end`.
      if (!slice.inFlight || slice.inFlight.sourceMessageId !== op.messageId || slice.inFlight.frozen) return
      slice.inFlight = {
        ...slice.inFlight,
        sourceMessageId: undefined,
        usage: op.usage ?? slice.inFlight.usage,
      }
      return
    }

    case 'agent-end': {
      // This is the only State 1 → State 2 boundary. It captures the exact
      // elapsed duration, then persists one complete response run.
      if (slice.inFlight && !slice.inFlight.frozen) {
        const fallbackActivity = slice.inFlight.activityTimeline.length === 0 && slice.inFlight.response.some((block) => block.type === 'text' && block.text.trim())
          ? [{ kind: 'planning' as const, id: `activity-${slice.inFlight.id}`, summary: 'Generated response', startedAt: Date.now(), endedAt: Date.now(), sequence: slice.inFlight.nextSequence }]
          : []
        const frozen = freezeAssistantState({ ...slice.inFlight, activityTimeline: [...slice.inFlight.activityTimeline, ...fallbackActivity] })
        slice.messages = [...slice.messages, buildAssistantMessage(frozen)]
        slice.inFlight = null
      }
      slice.agentResponseActive = false
      return
    }

    case 'set-frozen': {
      // Explicit recovery freeze without model/usage. The slice's notify path
      // detects inFlight.frozen and pushes the finalized message to disk.
      if (!slice.inFlight || slice.inFlight.id !== op.messageId || slice.inFlight.frozen) return
      slice.inFlight = freezeAssistantState(slice.inFlight)
      return
    }

    case 'append-error': {
      // Append a warning/error timeline item, freeze, push to messages
      // with empty response, clear inFlight. Idempotent if already frozen.
      if (!slice.inFlight || slice.inFlight.id !== op.messageId || slice.inFlight.frozen) return
      const idPrefix = op.recoverable ? 'warning' : 'error'
      const item: WarningTimelineItem | ErrorTimelineItem = op.recoverable
        ? {
            kind: 'warning',
            id: `${idPrefix}-${op.messageId}-${Date.now()}`,
            message: op.message,
          }
        : {
            kind: 'error',
            id: `${idPrefix}-${op.messageId}-${Date.now()}`,
            message: op.message,
          }
      const frozen = freezeAssistantState({
        ...slice.inFlight,
        activityTimeline: [...slice.inFlight.activityTimeline, item],
      })
      const message: AssistantMessage = {
        ...buildAssistantMessage(frozen),
        response: [],
      }
      slice.messages = [...slice.messages, message]
      slice.inFlight = null
      return
    }

    case 'increment-inflight': {
      slice.inFlightToolCount = Math.max(0, slice.inFlightToolCount + op.delta)
      return
    }

    case 'set-messages': {
      // Plain merge by id. Main process is a pure forwarder — it never
      // sends streaming state, so no streaming preservation needed.
      const byId = new Map<string, ChatRow>()
      for (const m of slice.messages) byId.set(m.id, m)
      for (const m of op.messages) byId.set(m.id, m)
      slice.messages = Array.from(byId.values())
      // If a finalized row's id matches the current inFlight, the freeze
      // already landed — clear the slot to avoid double-rendering.
      if (slice.inFlight && slice.messages.some((m) => m.id === slice.inFlight!.id)) {
        slice.inFlight = null
      }
      if (slice.messages.length > MAX_QUEUE_MESSAGES) {
        slice.messages = slice.messages.slice(-MAX_QUEUE_MESSAGES)
      }
      return
    }

    case 'append-compaction-summary': {
      // Append a compaction-summary block to the live in-flight response
      // and the parts[] mirror. Compaction events fire mid-conversation
      // before message-end — if the message has already frozen, drop.
      // Stamp `now` so the block sorts into its correct chronological
      // position between the timeline items that bracket it.
      if (!slice.inFlight) return
      const now = Date.now()
      const block = {
        type: 'compaction-summary' as const,
        tokensBefore: op.tokensBefore,
        summary: op.summary,
        startedAt: now,
      }
      const part: ContentPart = {
        type: 'compaction-summary',
        tokensBefore: op.tokensBefore,
        summary: op.summary,
        startedAt: now,
      }
      slice.inFlight = {
        ...slice.inFlight,
        parts: [...slice.inFlight.parts, part],
        response: [...slice.inFlight.response, block],
      }
      return
    }
  }
}
