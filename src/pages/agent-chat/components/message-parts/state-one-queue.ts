/**
 * Per-message lineage — the ordered, deduped chain of every thinking +
 * tool-call row the agent emitted while generating a response.
 *
 * Phase A scope:
 *   - `lineage` is the legacy field on `RuntimeAssistantState` that the
 *     existing AssistantMessage UI reads. The queue ops dual-write it.
 *   - Phase B will replace `lineage` with `activityTimeline` + `response`
 *     (in `src/models/assistant-message.ts`). Phase D will retire this
 *     module.
 *
 * Why pure functions (not a class):
 *   - `lineage` is plain data on the message. It serializes cleanly.
 *   - The queue's ops are pure functions over the message array.
 *   - The renderer derives a count label (`Thought 2 times`,
 *     `Tool call 3 times`) from the rows; pure helpers compose cleanly
 *     in JSX.
 *
 * Lifecycle:
 *   - `partsToLineage(parts)`     — derive initial lineage from a message's
 *                                   parts array (used on hydration).
 *   - `appendToLineage(rows, row)` — add a new row, or REPLACE an existing
 *                                   row with the same id. Dedup by id.
 *   - `accumulateLineage(rows, id, mutator)` — find the row by id and call
 *                                   `mutator(row)` to extend it (used for
 *                                   text/thinking/tool-call deltas).
 *   - `freezeLineage(rows)`        — seal the lineage. Every tool-call,
 *                                   thinking, and text row still in a
 *                                   non-`complete` state is force-flipped
 *                                   to `complete`. Idempotent.
 *   - `countByKind(rows)`          — return `{ thoughts, toolCalls }` for
 *                                   the fold label.
 *   - `formatDuration(ms)`         — format `(3.2s)` for the duration label.
 */

import type { ContentPart } from '@/models/runtime'

export type StateOneRow =
  | { kind: 'thinking'; id: string; text: string; state: 'streaming' | 'complete' }
  | {
      kind: 'tool-call'
      id: string
      toolName: string
      firstArg: string | null
      state: 'pending' | 'streaming-args' | 'complete'
    }
  | { kind: 'text'; id: string; text: string; state: 'streaming' | 'complete' }
  | { kind: 'image'; id: string }
  | { kind: 'compaction'; id: string; tokensBefore: number }

/**
 * Derive a lineage array from a message's `parts` array.
 */
export function partsToLineage(parts: readonly ContentPart[]): readonly StateOneRow[] {
  const out: StateOneRow[] = []
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i]!
    if (part.type === 'thinking') {
      out.push({
        kind: 'thinking',
        id: `thinking-${part.text.slice(0, 8)}-${i}`,
        text: part.text,
        state: part.state,
      })
    } else if (part.type === 'tool-call') {
      out.push({
        kind: 'tool-call',
        id: `toolcall-${part.id}`,
        toolName: part.name,
        firstArg: null,
        state: part.state,
      })
    }
  }
  return out
}

/** Add a new row, or REPLACE an existing row with the same id. */
export function appendToLineage(
  rows: readonly StateOneRow[],
  row: StateOneRow,
): readonly StateOneRow[] {
  const idx = rows.findIndex((r) => r.id === row.id)
  if (idx >= 0) {
    const next = rows.slice()
    next[idx] = row
    return next
  }
  return [...rows, row]
}

/** Find the row by id and apply `mutator(row)` to mutate it in place. */
export function accumulateLineage(
  rows: readonly StateOneRow[],
  id: string,
  mutator: (row: StateOneRow) => void,
): readonly StateOneRow[] {
  const idx = rows.findIndex((r) => r.id === id)
  if (idx < 0) return rows
  const current = rows[idx]!
  mutator(current)
  const next = rows.slice()
  next[idx] = current
  return next
}

/** Find the row by id and return it, or undefined if not present. */
export function findInLineage(
  rows: readonly StateOneRow[],
  id: string,
): StateOneRow | undefined {
  return rows.find((r) => r.id === id)
}

/** Seal the lineage. Idempotent. */
export function freezeLineage(
  rows: readonly StateOneRow[],
): readonly StateOneRow[] {
  let changed = false
  const next: StateOneRow[] = rows.slice()
  for (let i = 0; i < next.length; i += 1) {
    const row = next[i]!
    if (
      (row.kind === 'tool-call' ||
        row.kind === 'thinking' ||
        row.kind === 'text') &&
      row.state !== 'complete'
    ) {
      next[i] = { ...row, state: 'complete' as const }
      changed = true
    }
  }
  return changed ? next : rows
}

/** Count the rows by kind. */
export function countByKind(rows: readonly StateOneRow[]): {
  thoughts: number
  toolCalls: number
} {
  let thoughts = 0
  let toolCalls = 0
  for (const r of rows) {
    if (r.kind === 'thinking') thoughts += 1
    else if (r.kind === 'tool-call') toolCalls += 1
  }
  return { thoughts, toolCalls }
}

/** Format a duration in ms as `(3.2s)`. */
export function formatDuration(ms: number): string {
  if (ms < 0) return '(0.0s)'
  const seconds = ms / 1000
  if (seconds < 60) return `(${seconds.toFixed(1)}s)`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds - minutes * 60
  return `(${minutes}m ${rest.toFixed(0)}s)`
}
