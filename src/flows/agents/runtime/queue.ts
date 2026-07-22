/**
 * Per-agent stream queue — the data pipeline between the IPC event stream
 * and the renderer's runtime slice.
 *
 * Phase BD scope:
 *   - The queue mutates `slice.inFlight` for every streaming op. `inFlight`
 *     is a `RuntimeAssistantState` with three coordinated surfaces:
 *     `parts` (internal mutation target — never persisted), `activityTimeline`
 *     (the chain metadata), and `response` (the assistant prose).
 *   - `slice.messages: ChatRow[]` only grows on freeze (via `finalize-message`,
 *     `set-frozen`, or `append-error`). It contains finalized rows only.
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
  CompletionTimelineItem,
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
 *   - appends a `CompletionTimelineItem`,
 *   - computes `totalDurationMs`,
 *   - sets `frozen: true`.
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
      if (item.state !== 'complete') {
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

  // Append a completion marker. Skip when one is already last (idempotency
  // for repeated freeze calls).
  const last = activityTimeline[activityTimeline.length - 1]
  const finalTimeline: TimelineItem[] =
    last && last.kind === 'completion'
      ? activityTimeline
      : [
          ...activityTimeline,
          {
            kind: 'completion',
            id: `completion-${state.id}`,
          } satisfies CompletionTimelineItem,
        ]

  const metadata: AssistantMessageMetadata = {}
  if (extras.usage) metadata.usage = extras.usage
  if (extras.model) metadata.model = extras.model
  metadata.totalDurationMs = totalDurationMs

  return {
    ...state,
    activityTimeline: finalTimeline,
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
  if (!slice.inFlight || slice.inFlight.id !== messageId) return false
  const next = mutator(slice.inFlight)
  if (next === null) return false
  slice.inFlight = next
  return true
}

function appendThinkingTimelineItem(
  state: RuntimeAssistantState,
  startedAt: number,
): ThinkingTimelineItem {
  return {
    kind: 'thinking',
    id: `thinking-${startedAt}-${state.activityTimeline.length}`,
    text: '',
    state: 'streaming',
    startedAt,
    endedAt: 0,
  }
}

function appendToolCallTimelineItem(
  _state: RuntimeAssistantState,
  startedAt: number,
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
  }
}

// ---------------------------------------------------------------------------
// applyOp — the per-op dispatcher
// ---------------------------------------------------------------------------

function applyOp(slice: RuntimeSliceView, op: StreamOp): void {
  switch (op.kind) {
    case 'message-start': {
      // Initialize inFlight. If the same id is already in messages (rare —
      // would mean the main process emitted a finalized row whose id
      // matches an in-flight slot), skip.
      if (slice.inFlight && slice.inFlight.id === op.messageId) return
      if (slice.messages.some((m) => m.id === op.messageId)) return
      const startedAt = slice.lastResponseStart ?? Date.now()
      slice.lastResponseStart = null
      slice.inFlight = {
        id: op.messageId,
        role: op.role,
        ts: startedAt,
        parts: [],
        activityTimeline: [],
        response: [],
      }
      return
    }

    case 'append-part': {
      withInFlight(slice, op.messageId, (state) => {
        const now = Date.now()
        const parts = [...state.parts, op.part]
        let activityTimeline = state.activityTimeline
        let response = state.response

        if (op.part.type === 'thinking') {
          activityTimeline = [...activityTimeline, appendThinkingTimelineItem(state, now)]
        } else if (op.part.type === 'tool-call') {
          activityTimeline = [
            ...activityTimeline,
            appendToolCallTimelineItem(state, now, op.part.id, op.part.name),
          ]
        } else if (op.part.type === 'text') {
          response = [
            ...response,
            { type: 'text', text: op.part.text, state: op.part.state ?? 'streaming' },
          ]
        } else if (op.part.type === 'image') {
          response = [...response, { type: 'image', data: op.part.data, mimeType: op.part.mimeType }]
        } else if (op.part.type === 'compaction-summary') {
          response = [
            ...response,
            {
              type: 'compaction-summary',
              tokensBefore: op.part.tokensBefore,
              summary: op.part.summary,
            },
          ]
        }
        return { ...state, parts, activityTimeline, response }
      })
      return
    }

    case 'append-delta': {
      withInFlight(slice, op.messageId, (state) => {
        const parts = [...state.parts]
        const activityTimeline = [...state.activityTimeline]
        const response = [...state.response]

        if (op.partType === 'text') {
          const last = response[response.length - 1]
          if (last && last.type === 'text') {
            response[response.length - 1] = {
              ...last,
              text: last.text + op.delta,
              state: 'streaming',
            }
          } else {
            response.push({ type: 'text', text: op.delta, state: 'streaming' })
          }
          // Mirror into parts[] (parts is the internal mutation target).
          const lastPart = parts[parts.length - 1]
          if (lastPart && lastPart.type === 'text') {
            parts[parts.length - 1] = {
              ...lastPart,
              text: lastPart.text + op.delta,
              state: 'streaming',
            }
          } else {
            parts.push({ type: 'text', text: op.delta, state: 'streaming' })
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
            const fresh = appendThinkingTimelineItem(state, Date.now())
            fresh.text = op.delta
            activityTimeline.push(fresh)
          }
        }
        return { ...state, parts, activityTimeline, response }
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
        const now = Date.now()
        const parts = state.parts.map((p) => {
          if (p.type === 'tool-call' && p.id === op.toolCallId) {
            return { ...p, args: op.args, state: 'complete' as const }
          }
          return p
        })
        const activityTimeline = state.activityTimeline.map((item) => {
          if (item.kind === 'tool-call' && item.id === `toolcall-${op.toolCallId}`) {
            return { ...item, state: 'complete' as const, endedAt: now }
          }
          return item
        })
        return { ...state, parts, activityTimeline }
      })
      return
    }

    case 'finalize-tool-result': {
      // Mutate inFlight.parts[] only (per spec — UI drops tool output).
      // Tool-result is never mirrored to activityTimeline or response.
      // `finalize-tool-result` carries no `messageId`; the in-flight
      // assistant message is the only place tool-results can land.
      if (!slice.inFlight) return
      const toolCallId = op.toolCallId
      const parts = slice.inFlight.parts.slice()
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
      slice.inFlight = { ...slice.inFlight, parts }
      return
    }

    case 'finalize-message': {
      // Freeze + build + push + clear in one shot.
      if (!slice.inFlight || slice.inFlight.id !== op.messageId || slice.inFlight.frozen) return
      const frozen = freezeAssistantState(slice.inFlight, {
        model: op.model,
        usage: op.usage,
      })
      const message = buildAssistantMessage(frozen)
      slice.messages = [...slice.messages, message]
      slice.inFlight = null
      return
    }

    case 'set-frozen': {
      // Force-freeze (e.g. 60s safety net) without model/usage. The slice's
      // notify path detects inFlight.frozen and pushes to messages.
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
      if (!slice.inFlight) return
      const block = {
        type: 'compaction-summary' as const,
        tokensBefore: op.tokensBefore,
        summary: op.summary,
      }
      const part: ContentPart = {
        type: 'compaction-summary',
        tokensBefore: op.tokensBefore,
        summary: op.summary,
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
