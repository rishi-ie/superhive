/**
 * Per-agent stream queue — the data pipeline between the IPC event stream
 * and the renderer's runtime slice.
 *
 * Phase A scope:
 *   - The queue still mutates `parts[]` + `lineage[]` on
 *     `RuntimeAssistantState` (legacy shape). The UI uses these fields.
 *   - `activityTimeline` + `response` are scaffold fields on
 *     `RuntimeAssistantState` (added by the new `assistant-message.ts`
 *     types). Phase A initializes them empty but does not dual-write
 *     to them. Phase B will rewrite the queue to populate them.
 *   - Streaming state never reaches disk — the main process is a pure
 *     forwarder (see `general-kai-runtime.ts`).
 *
 * Architecture:
 *   IPC event → event-translator → enqueue(op) → tick (50ms) → applyOp(slice) → notify
 */

import type {
  ContentPart,
  RuntimeAssistantState,
  RuntimeSliceView,
  StreamOp,
  AccessorFn,
} from '@/models/runtime'
import { AGENT_CHAT_MESSAGE_CAP } from '@/lib/constants'
import {
  type StateOneRow,
  appendToLineage,
  accumulateLineage,
  freezeLineage,
  partsToLineage,
} from '@/pages/agent-chat/components/message-parts/state-one-queue'

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

/**
 * A message has streaming state when any of its parts is currently
 * `streaming` or `pending`. Used to decide which version wins during a
 * merge between the renderer's in-flight state and a stale disk
 * snapshot.
 */
export function hasStreamingState(message: RuntimeAssistantState): boolean {
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
 * Merge two RuntimeAssistantState lists by id, preserving in-flight
 * streaming parts.
 *
 * - Existing messages with streaming parts are kept when the incoming
 *   version has the same id but no streaming state — protects in-flight
 *   UI from a stale refetch overwriting live deltas with disk state.
 * - When both versions have streaming state (or neither does),
 *   last-write-wins.
 * - Ids present only in `incoming` are appended at the end.
 * - Ids present only in `existing` are preserved.
 *
 * Position in the result list: existing order is preserved; incoming-only
 * ids land at the end in incoming order.
 */
export function mergeMessagesPreserveStreaming(
  existing: RuntimeAssistantState[],
  incoming: RuntimeAssistantState[],
): RuntimeAssistantState[] {
  const byId = new Map<string, RuntimeAssistantState>()
  for (const m of existing) byId.set(m.id, m)
  for (const m of incoming) {
    const current = byId.get(m.id)
    if (current && hasStreamingState(current) && !hasStreamingState(m)) {
      // Existing is live; incoming is stale (no streaming parts). Keep existing.
      continue
    }
    // `lineage` and `lineageFrozen` are renderer-only fields — the main
    // process only stores them after the renderer's `setMessageLineage`
    // IPC round-trips. When the main process emits `entry.messages`
    // immediately after `message-end` (BEFORE the IPC lands), the
    // incoming doesn't have these fields, but the renderer just froze
    // the message via `finalize-message`. Preserve them from `current`
    // so the freeze survives the merge.
    const merged: RuntimeAssistantState = {
      ...m,
      lineage: m.lineage ?? current?.lineage,
      lineageFrozen: m.lineageFrozen ?? current?.lineageFrozen,
    }
    byId.set(m.id, merged)
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
        const startedAt = slice.lastResponseStart ?? Date.now()
        slice.lastResponseStart = null
        slice.messages = [
          ...slice.messages,
          {
            id: op.messageId,
            role: op.role,
            parts: [],
            activityTimeline: [],
            response: [],
            lineage: [],
            ts: startedAt,
          },
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
      // Mirror chain-shaped parts into the lineage.
      const row = partToLineageRow(op.part)
      if (row) {
        const next = appendToLineage(cur.lineage ?? [], row)
        slice.messages = [
          ...slice.messages.slice(0, idx),
          { ...slice.messages[idx]!, lineage: next },
          ...slice.messages.slice(idx + 1),
        ]
      }
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

      // thinking — mirror into lineage by walking to the trailing thinking row.
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
        const lineageId = `thinking-${updated.text.slice(0, 8)}-${cur.parts.length - 1}`
        const next = accumulateLineage(
          cur.lineage ?? [],
          lineageId,
          (row) => {
            if (row.kind === 'thinking') {
              row.text = updated.text
              row.state = 'streaming'
            }
          },
        )
        slice.messages = [
          ...slice.messages.slice(0, idx),
          { ...slice.messages[idx]!, lineage: next },
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
      const lineageId = `thinking-${appended.text.slice(0, 8)}-${cur.parts.length}`
      slice.messages = [
        ...slice.messages.slice(0, idx),
        {
          ...slice.messages[idx]!,
          lineage: appendToLineage(slice.messages[idx]!.lineage ?? [], {
            kind: 'thinking',
            id: lineageId,
            text: appended.text,
            state: 'streaming',
          }),
        },
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
      // Flip the lineage row's state to complete.
      const lineageId = `toolcall-${op.toolCallId}`
      const next = accumulateLineage(cur.lineage ?? [], lineageId, (row) => {
        if (row.kind === 'tool-call') row.state = 'complete'
      })
      slice.messages = [
        ...slice.messages.slice(0, idx),
        { ...slice.messages[idx]!, lineage: next },
        ...slice.messages.slice(idx + 1),
      ]
      return
    }
    case 'finalize-message': {
      const idx = slice.messages.findIndex((m) => m.id === op.messageId)
      if (idx === -1) return
      const cur = slice.messages[idx]!
      const totalDurationMs = Date.now() - cur.ts
      slice.messages = [
        ...slice.messages.slice(0, idx),
        {
          ...cur,
          lineageFrozen: true,
          frozen: true,
          totalDurationMs,
          lineage: freezeLineage(cur.lineage ?? []),
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
    case 'set-lineage': {
      // Force-freeze without going through finalize-message. Used by the
      // 60s safety net when the agent never emits `message-end`.
      const idx = slice.messages.findIndex((m) => m.id === op.messageId)
      if (idx === -1) return
      const cur = slice.messages[idx]!
      slice.messages = [
        ...slice.messages.slice(0, idx),
        {
          ...cur,
          lineageFrozen: true,
          frozen: true,
          totalDurationMs: Date.now() - cur.ts,
          lineage: freezeLineage(cur.lineage ?? []),
        },
        ...slice.messages.slice(idx + 1),
      ]
      return
    }
    case 'finalize-tool-result': {
      let foundMsgIdx = -1
      let foundPartIdx = -1
      for (let i = 0; i < slice.messages.length; i += 1) {
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
      slice.messages = mergeMessagesPreserveStreaming(slice.messages, op.messages as RuntimeAssistantState[])
      // Hydration: ensure every incoming message has a lineage field so the
      // renderer can read it without a null-check. Older chat.jsonl files
      // (pre-lineage) won't have one — derive from parts in that case.
      slice.messages = slice.messages.map((m) => {
        if (m.lineage !== undefined) return m
        return { ...m, lineage: partsToLineage(m.parts) }
      })
      if (slice.messages.length > MAX_QUEUE_MESSAGES) {
        slice.messages = slice.messages.slice(-MAX_QUEUE_MESSAGES)
      }
      return
    }
    case 'append-compaction-summary': {
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

/**
 * Map a single ContentPart to a StateOneRow, or null if the part is
 * prose-shaped (text + image + compaction-summary). Used by `append-part`
 * to mirror chain parts into the lineage.
 */
function partToLineageRow(part: ContentPart): StateOneRow | null {
  if (part.type === 'thinking') {
    return {
      kind: 'thinking',
      id: `thinking-${part.text.slice(0, 8)}`,
      text: part.text,
      state: part.state,
    }
  }
  if (part.type === 'tool-call') {
    return {
      kind: 'tool-call',
      id: `toolcall-${part.id}`,
      toolName: part.name,
      firstArg: null,
      state: part.state,
    }
  }
  return null
}
