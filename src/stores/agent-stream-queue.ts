import type { ContentPart, RuntimeMessage, ToolResultContent } from '@/models/runtime'

export const QUEUE_TICK_MS = 50
const MAX_QUEUE_SIZE = 1000
/** Cap matches disk trim (5000). Drop oldest rows beyond this. */
export const MAX_QUEUE_MESSAGES = 5000

export type StreamOp =
  | {
      kind: 'message-start'
      agentId: string
      messageId: string
      role: 'user' | 'assistant'
    }
  | { kind: 'append-part'; agentId: string; messageId: string; part: ContentPart }
  | {
      kind: 'append-delta'
      agentId: string
      messageId: string
      partType: 'text' | 'thinking'
      delta: string
    }
  | {
      kind: 'append-tool-call-delta'
      agentId: string
      messageId: string
      toolCallId: string
      delta: string
    }
  | {
      kind: 'finalize-part'
      agentId: string
      messageId: string
      partType: 'text' | 'thinking'
      content?: string
    }
  | {
      kind: 'finalize-tool-call'
      agentId: string
      messageId: string
      toolCallId: string
      args: unknown
    }
  | {
      kind: 'finalize-tool-result'
      agentId: string
      toolCallId: string
      result: ToolResultContent[]
      isError: boolean
    }
  | { kind: 'finalize-message'; agentId: string; messageId: string }
  | { kind: 'increment-inflight'; agentId: string; delta: number }
  | {
      kind: 'set-messages'
      agentId: string
      messages: RuntimeMessage[]
    }
  | {
      kind: 'append-compaction-summary'
      agentId: string
      summary: string
      tokensBefore: number
    }

export interface RuntimeSliceView {
  messages: RuntimeMessage[]
  inFlightToolCount: number
}

export interface SliceAccessor {
  slice: RuntimeSliceView
  notify: () => void
}

export type AccessorFn = (agentId: string) => SliceAccessor | null

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

/**
 * A message has streaming state when any of its parts is currently
 * `streaming` or `pending`. Used to decide which version wins during a merge
 * between the renderer's in-flight state and a stale disk snapshot: the
 * streaming version preserves in-flight text/thinking/tool-call deltas that
 * haven't been persisted yet.
 */
export function hasStreamingState(message: RuntimeMessage): boolean {
  return message.parts.some((p) => {
    if (p.type === 'text' || p.type === 'thinking') {
      return p.state === 'streaming'
    }
    if (p.type === 'tool-call' || p.type === 'tool-result') {
      return p.state === 'pending' || p.state === 'streaming' || p.state === 'streaming-args'
    }
    return false
  })
}

/**
 * Merge two RuntimeMessage lists by id, preserving in-flight streaming parts.
 *
 * - Existing messages with streaming parts are kept when the incoming version
 *   has the same id but no streaming state — protects in-flight UI from a
 *   stale refetch overwriting live deltas with disk state.
 * - When both versions have streaming state (or neither does), last-write-wins
 *   (incoming overwrites existing for the same id).
 * - Ids present only in `incoming` are appended at the end.
 * - Ids present only in `existing` are preserved.
 *
 * Position in the result list: existing order is preserved; incoming-only
 * ids land at the end in incoming order.
 */
export function mergeMessagesPreserveStreaming(
  existing: RuntimeMessage[],
  incoming: RuntimeMessage[],
): RuntimeMessage[] {
  const byId = new Map<string, RuntimeMessage>()
  for (const m of existing) byId.set(m.id, m)
  for (const m of incoming) {
    const current = byId.get(m.id)
    if (current && hasStreamingState(current) && !hasStreamingState(m)) {
      // Existing is live; incoming is stale (no streaming parts). Keep existing.
      continue
    }
    byId.set(m.id, m)
  }
  return Array.from(byId.values())
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

function applyOp(slice: RuntimeSliceView, op: StreamOp): void {
  switch (op.kind) {
    case 'message-start': {
      if (!slice.messages.some((m) => m.id === op.messageId)) {
        slice.messages = [
          ...slice.messages,
          { id: op.messageId, role: op.role, parts: [], ts: Date.now() },
        ]
      }
      return
    }
    case 'append-part': {
      const idx = slice.messages.findIndex((m) => m.id === op.messageId)
      if (idx === -1) return
      const cur = slice.messages[idx]!
      slice.messages = [
        ...slice.messages.slice(0, idx),
        { ...cur, parts: [...cur.parts, op.part] },
        ...slice.messages.slice(idx + 1),
      ]
      return
    }
    case 'append-delta': {
      const idx = slice.messages.findIndex((m) => m.id === op.messageId)
      if (idx === -1) return
      const cur = slice.messages[idx]!
      const last = cur.parts[cur.parts.length - 1]

      if (op.partType === 'text') {
        if (last && last.type === 'text') {
          const updated: ContentPart = {
            ...last,
            text: last.text + op.delta,
            state: 'streaming',
          }
          slice.messages = [
            ...slice.messages.slice(0, idx),
            { ...cur, parts: [...cur.parts.slice(0, -1), updated] },
            ...slice.messages.slice(idx + 1),
          ]
          return
        }
        const appended: ContentPart = {
          type: 'text',
          text: op.delta,
          state: 'streaming',
        }
        slice.messages = [
          ...slice.messages.slice(0, idx),
          { ...cur, parts: [...cur.parts, appended] },
          ...slice.messages.slice(idx + 1),
        ]
        return
      }

      // thinking
      if (last && last.type === 'thinking') {
        const updated: ContentPart = {
          ...last,
          text: last.text + op.delta,
          state: 'streaming',
        }
        slice.messages = [
          ...slice.messages.slice(0, idx),
          { ...cur, parts: [...cur.parts.slice(0, -1), updated] },
          ...slice.messages.slice(idx + 1),
        ]
        return
      }
      const appended: ContentPart = {
        type: 'thinking',
        text: op.delta,
        state: 'streaming',
      }
      slice.messages = [
        ...slice.messages.slice(0, idx),
        { ...cur, parts: [...cur.parts, appended] },
        ...slice.messages.slice(idx + 1),
      ]
      return
    }
    case 'append-tool-call-delta': {
      const idx = slice.messages.findIndex((m) => m.id === op.messageId)
      if (idx === -1) return
      const cur = slice.messages[idx]!
      const partIdx = cur.parts.findIndex(
        (p) => p.type === 'tool-call' && p.id === op.toolCallId,
      )
      if (partIdx === -1) return
      const part = cur.parts[partIdx]!
      if (part.type !== 'tool-call') return
      const prevArgs = typeof part.args === 'string' ? part.args : ''
      slice.messages = [
        ...slice.messages.slice(0, idx),
        {
          ...cur,
          parts: [
            ...cur.parts.slice(0, partIdx),
            {
              ...part,
              args: prevArgs + op.delta,
              state: 'streaming-args',
            },
            ...cur.parts.slice(partIdx + 1),
          ],
        },
        ...slice.messages.slice(idx + 1),
      ]
      return
    }
    case 'finalize-part': {
      const idx = slice.messages.findIndex((m) => m.id === op.messageId)
      if (idx === -1) return
      const cur = slice.messages[idx]!
      let flipped = false
      slice.messages = [
        ...slice.messages.slice(0, idx),
        {
          ...cur,
          parts: cur.parts.map((p) => {
            if (flipped || p.type !== op.partType || p.state === 'complete') return p
            flipped = true
            return { ...p, text: op.content ?? p.text, state: 'complete' as const }
          }),
        },
        ...slice.messages.slice(idx + 1),
      ]
      return
    }
    case 'finalize-tool-call': {
      const idx = slice.messages.findIndex((m) => m.id === op.messageId)
      if (idx === -1) return
      const cur = slice.messages[idx]!
      const partIdx = cur.parts.findIndex(
        (p) => p.type === 'tool-call' && p.id === op.toolCallId,
      )
      if (partIdx === -1) return
      const part = cur.parts[partIdx]!
      if (part.type !== 'tool-call') return
      slice.messages = [
        ...slice.messages.slice(0, idx),
        {
          ...cur,
          parts: [
            ...cur.parts.slice(0, partIdx),
            { ...part, args: op.args, state: 'complete' as const },
            ...cur.parts.slice(partIdx + 1),
          ],
        },
        ...slice.messages.slice(idx + 1),
      ]
      return
    }
    case 'finalize-message': {
      const idx = slice.messages.findIndex((m) => m.id === op.messageId)
      if (idx === -1) return
      const cur = slice.messages[idx]!
      slice.messages = [
        ...slice.messages.slice(0, idx),
        {
          ...cur,
          parts: cur.parts.map((p) =>
            (p.type === 'text' || p.type === 'thinking') && p.state === 'streaming'
              ? { ...p, state: 'complete' as const }
              : p,
          ),
        },
        ...slice.messages.slice(idx + 1),
      ]
      return
    }
    case 'finalize-tool-result': {
      // `tool-execution-end` arrives without a `messageId` — find the message
      // containing the matching tool-call and link the result to it.
      let foundMsgIdx = -1
      let foundPartIdx = -1
      for (let i = 0; i < slice.messages.length; i++) {
        const partIdx = slice.messages[i]!.parts.findIndex(
          (p) => p.type === 'tool-call' && p.id === op.toolCallId,
        )
        if (partIdx !== -1) {
          foundMsgIdx = i
          foundPartIdx = partIdx
          break
        }
      }
      if (foundMsgIdx === -1) return
      const cur = slice.messages[foundMsgIdx]!
      const toolResultPart: ContentPart = {
        type: 'tool-result',
        id: op.toolCallId,
        name: '',
        result: op.result,
        isError: op.isError,
        state: 'complete',
      }
      // If a streaming tool-result already exists (from tool-execution-update),
      // replace it; otherwise insert immediately after the tool-call.
      const existingResultIdx = cur.parts.findIndex(
        (p) => p.type === 'tool-result' && p.id === op.toolCallId,
      )
      let newParts: ContentPart[]
      if (existingResultIdx >= 0) {
        newParts = [
          ...cur.parts.slice(0, existingResultIdx),
          toolResultPart,
          ...cur.parts.slice(existingResultIdx + 1),
        ]
      } else {
        newParts = [
          ...cur.parts.slice(0, foundPartIdx + 1),
          toolResultPart,
          ...cur.parts.slice(foundPartIdx + 1),
        ]
      }
      slice.messages = [
        ...slice.messages.slice(0, foundMsgIdx),
        { ...cur, parts: newParts },
        ...slice.messages.slice(foundMsgIdx + 1),
      ]
      return
    }
    case 'increment-inflight': {
      slice.inFlightToolCount = Math.max(0, slice.inFlightToolCount + op.delta)
      return
    }
    case 'set-messages': {
      // Bulk merge: dedup incoming by id, preserve in-flight streaming state
      // on the renderer side, append new ids at the end. Drop oldest rows
      // beyond MAX_QUEUE_MESSAGES.
      slice.messages = mergeMessagesPreserveStreaming(slice.messages, op.messages)
      if (slice.messages.length > MAX_QUEUE_MESSAGES) {
        slice.messages = slice.messages.slice(-MAX_QUEUE_MESSAGES)
      }
      return
    }
    case 'append-compaction-summary': {
      // Find the most recent assistant message and append a summary card.
      for (let i = slice.messages.length - 1; i >= 0; i--) {
        if (slice.messages[i]!.role !== 'assistant') continue
        slice.messages = [
          ...slice.messages.slice(0, i),
          {
            ...slice.messages[i]!,
            parts: [
              ...slice.messages[i]!.parts,
              {
                type: 'compaction-summary',
                tokensBefore: op.tokensBefore,
                summary: op.summary,
              },
            ],
          },
          ...slice.messages.slice(i + 1),
        ]
        return
      }
      return
    }
  }
}
