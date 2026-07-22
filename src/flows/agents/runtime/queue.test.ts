/**
 * Tests for the per-agent stream queue that buffers Pi events at a 50ms tick
 * cadence before applying them to the renderer runtime slice.
 *
 * Run via `bun test src/flows/agents/runtime/queue.test.ts`.
 */

import { afterEach, describe, expect, test } from 'bun:test'
import {
  _test_drainNow,
  clearAgentQueue,
  clearAll,
  enqueue,
  hasStreamingState,
  mergeMessagesPreserveStreaming,
  pendingOpsCount,
  QUEUE_TICK_MS,
  setSliceAccessor,
  type SliceAccessor,
  type StreamOp,
} from './queue'
import type { RuntimeMessage } from '@/models/runtime'

function makeSlice(): {
  slice: SliceAccessor['slice']
  getNotifyCount: () => number
} {
  const slice: SliceAccessor['slice'] = {
    messages: [],
    inFlightToolCount: 0,
    lastResponseStart: null,
  }
  let notifyCount = 0
  const accessor: SliceAccessor = {
    slice,
    notify: () => {
      notifyCount += 1
    },
  }
  setSliceAccessor((agentId) => (agentId === 'a1' ? accessor : null))
  return {
    slice,
    getNotifyCount: () => notifyCount,
  }
}

afterEach(() => {
  clearAll()
  setSliceAccessor(() => null)
})

describe('agent-stream-queue', () => {
  test('queues ops and applies on drain', () => {
    const { slice, getNotifyCount } = makeSlice()
    enqueue({
      kind: 'message-start',
      agentId: 'a1',
      messageId: 'm1',
      role: 'assistant',
    })
    enqueue({
      kind: 'append-delta',
      agentId: 'a1',
      messageId: 'm1',
      partType: 'text',
      delta: 'hello ',
    })
    enqueue({
      kind: 'append-delta',
      agentId: 'a1',
      messageId: 'm1',
      partType: 'text',
      delta: 'world',
    })
    enqueue({
      kind: 'finalize-part',
      agentId: 'a1',
      messageId: 'm1',
      partType: 'text',
    })
    expect(pendingOpsCount('a1')).toBe(4)
    expect(slice.messages).toHaveLength(0)
    expect(getNotifyCount()).toBe(0)

    _test_drainNow()

    expect(pendingOpsCount('a1')).toBe(0)
    expect(slice.messages).toHaveLength(1)
    const textPart = slice.messages[0]!.parts[0]
    expect(textPart).toEqual({ type: 'text', text: 'hello world', state: 'complete' })
    expect(getNotifyCount()).toBe(1)
  })

  test('preserves op order per agent', () => {
    const { slice } = makeSlice()
    enqueue({ kind: 'message-start', agentId: 'a1', messageId: 'm', role: 'assistant' })
    enqueue({ kind: 'append-part', agentId: 'a1', messageId: 'm', part: { type: 'thinking', text: 'A', state: 'streaming' } })
    enqueue({ kind: 'append-part', agentId: 'a1', messageId: 'm', part: { type: 'thinking', text: 'B', state: 'streaming' } })
    enqueue({ kind: 'append-part', agentId: 'a1', messageId: 'm', part: { type: 'thinking', text: 'C', state: 'streaming' } })
    _test_drainNow()
    const parts = slice.messages[0]!.parts
    expect(parts.map((p) => (p.type === 'thinking' ? p.text : ''))).toEqual(['A', 'B', 'C'])
  })

  test('batches many ops into a single notify per agent per tick', () => {
    const { getNotifyCount } = makeSlice()
    enqueue({ kind: 'message-start', agentId: 'a1', messageId: 'm', role: 'assistant' })
    for (let i = 0; i < 100; i += 1) {
      enqueue({
        kind: 'append-delta',
        agentId: 'a1',
        messageId: 'm',
        partType: 'text',
        delta: 'x',
      })
    }
    expect(pendingOpsCount('a1')).toBe(101)
    expect(getNotifyCount()).toBe(0)
    _test_drainNow()
    expect(getNotifyCount()).toBe(1)
  })

  test('isolates agents', () => {
    const sliceA: SliceAccessor['slice'] = { messages: [], inFlightToolCount: 0, lastResponseStart: null }
    const sliceB: SliceAccessor['slice'] = { messages: [], inFlightToolCount: 0, lastResponseStart: null }
    setSliceAccessor((id) => {
      if (id === 'a1') return { slice: sliceA, notify: () => {} }
      if (id === 'a2') return { slice: sliceB, notify: () => {} }
      return null
    })

    enqueue({ kind: 'message-start', agentId: 'a1', messageId: 'm', role: 'assistant' })
    enqueue({ kind: 'message-start', agentId: 'a2', messageId: 'm', role: 'assistant' })
    enqueue({
      kind: 'append-delta',
      agentId: 'a1',
      messageId: 'm',
      partType: 'text',
      delta: 'A-text',
    })
    enqueue({
      kind: 'append-delta',
      agentId: 'a2',
      messageId: 'm',
      partType: 'text',
      delta: 'B-text',
    })

    _test_drainNow()

    expect(sliceA.messages[0]!.parts[0]).toMatchObject({ type: 'text', text: 'A-text' })
    expect(sliceB.messages[0]!.parts[0]).toMatchObject({ type: 'text', text: 'B-text' })
  })

  test('skips ops for unknown agents', () => {
    const { slice } = makeSlice()
    enqueue({ kind: 'message-start', agentId: 'ghost', messageId: 'm', role: 'assistant' })
    expect(() => _test_drainNow()).not.toThrow()
    expect(slice.messages).toHaveLength(0)
    expect(pendingOpsCount('ghost')).toBe(0)
  })

  test('clearAgentQueue drops only the named agent queue', () => {
    setSliceAccessor(() => null)
    enqueue({ kind: 'message-start', agentId: 'a1', messageId: 'm', role: 'assistant' })
    enqueue({ kind: 'message-start', agentId: 'a2', messageId: 'm', role: 'assistant' })
    clearAgentQueue('a1')
    expect(pendingOpsCount('a1')).toBe(0)
    expect(pendingOpsCount('a2')).toBe(1)
    clearAll()
  })

  test('clearAll also stops the timer (verified by no-ops after clear)', () => {
    setSliceAccessor(() => null)
    enqueue({ kind: 'message-start', agentId: 'a1', messageId: 'm', role: 'assistant' })
    clearAll()
    expect(pendingOpsCount('a1')).toBe(0)
  })

  test('append-delta appends to trailing text part', () => {
    const { slice } = makeSlice()
    enqueue({ kind: 'message-start', agentId: 'a1', messageId: 'm', role: 'assistant' })
    enqueue({
      kind: 'append-delta',
      agentId: 'a1',
      messageId: 'm',
      partType: 'text',
      delta: 'one',
    })
    enqueue({
      kind: 'append-delta',
      agentId: 'a1',
      messageId: 'm',
      partType: 'text',
      delta: '-two',
    })
    _test_drainNow()
    expect(slice.messages[0]!.parts).toHaveLength(1)
    expect(slice.messages[0]!.parts[0]).toEqual({
      type: 'text',
      text: 'one-two',
      state: 'streaming',
    })
  })

  test('append-delta for thinking creates a new part when no trailing thinking exists', () => {
    const { slice } = makeSlice()
    enqueue({ kind: 'message-start', agentId: 'a1', messageId: 'm', role: 'assistant' })
    enqueue({
      kind: 'append-part',
      agentId: 'a1',
      messageId: 'm',
      part: { type: 'text', text: 'hi', state: 'streaming' },
    })
    enqueue({
      kind: 'append-delta',
      agentId: 'a1',
      messageId: 'm',
      partType: 'thinking',
      delta: 'thinking1',
    })
    _test_drainNow()
    expect(slice.messages[0]!.parts).toHaveLength(2)
    expect(slice.messages[0]!.parts[1]).toEqual({
      type: 'thinking',
      text: 'thinking1',
      state: 'streaming',
    })
  })

  test('finalize-part flips first streaming part of matching type to complete', () => {
    const { slice } = makeSlice()
    enqueue({ kind: 'message-start', agentId: 'a1', messageId: 'm', role: 'assistant' })
    enqueue({
      kind: 'append-part',
      agentId: 'a1',
      messageId: 'm',
      part: { type: 'thinking', text: 'a', state: 'streaming' },
    })
    enqueue({
      kind: 'append-part',
      agentId: 'a1',
      messageId: 'm',
      part: { type: 'thinking', text: 'b', state: 'streaming' },
    })
    enqueue({
      kind: 'finalize-part',
      agentId: 'a1',
      messageId: 'm',
      partType: 'thinking',
    })
    _test_drainNow()
    const parts = slice.messages[0]!.parts
    expect((parts[0] as { state: string }).state).toBe('complete')
    expect((parts[1] as { state: string }).state).toBe('streaming')
  })

  test('finalize-part overrides content when provided', () => {
    const { slice } = makeSlice()
    enqueue({ kind: 'message-start', agentId: 'a1', messageId: 'm', role: 'assistant' })
    enqueue({
      kind: 'append-delta',
      agentId: 'a1',
      messageId: 'm',
      partType: 'thinking',
      delta: 'partial',
    })
    enqueue({
      kind: 'finalize-part',
      agentId: 'a1',
      messageId: 'm',
      partType: 'thinking',
      content: 'final',
    })
    _test_drainNow()
    const part = slice.messages[0]!.parts[0]
    expect(part).toEqual({ type: 'thinking', text: 'final', state: 'complete' })
  })

  test('finalize-tool-call matches by toolCallId and sets args + complete', () => {
    const { slice } = makeSlice()
    enqueue({ kind: 'message-start', agentId: 'a1', messageId: 'm', role: 'assistant' })
    enqueue({
      kind: 'append-part',
      agentId: 'a1',
      messageId: 'm',
      part: { type: 'tool-call', id: 'tc1', name: 'bash', args: undefined, state: 'pending' },
    })
    enqueue({
      kind: 'finalize-tool-call',
      agentId: 'a1',
      messageId: 'm',
      toolCallId: 'tc1',
      args: { command: 'ls' },
    })
    _test_drainNow()
    const part = slice.messages[0]!.parts[0]
    expect(part).toEqual({
      type: 'tool-call',
      id: 'tc1',
      name: 'bash',
      args: { command: 'ls' },
      state: 'complete',
    })
  })

  test('append-tool-call-delta appends to the matching tool-call args', () => {
    const { slice } = makeSlice()
    enqueue({ kind: 'message-start', agentId: 'a1', messageId: 'm', role: 'assistant' })
    enqueue({
      kind: 'append-part',
      agentId: 'a1',
      messageId: 'm',
      part: { type: 'tool-call', id: 'tc1', name: 'bash', args: '{"co', state: 'streaming-args' },
    })
    enqueue({
      kind: 'append-tool-call-delta',
      agentId: 'a1',
      messageId: 'm',
      toolCallId: 'tc1',
      delta: 'mmand":"ls"}',
    })
    _test_drainNow()
    const part = slice.messages[0]!.parts[0]
    expect(part).toEqual({
      type: 'tool-call',
      id: 'tc1',
      name: 'bash',
      args: '{"command":"ls"}',
      state: 'streaming-args',
    })
  })

  test('finalize-message flips any leftover streaming text/thinking to complete', () => {
    const { slice } = makeSlice()
    enqueue({ kind: 'message-start', agentId: 'a1', messageId: 'm', role: 'assistant' })
    enqueue({
      kind: 'append-delta',
      agentId: 'a1',
      messageId: 'm',
      partType: 'text',
      delta: 'in-flight text',
    })
    enqueue({
      kind: 'append-delta',
      agentId: 'a1',
      messageId: 'm',
      partType: 'thinking',
      delta: 'in-flight thought',
    })
    enqueue({ kind: 'finalize-message', agentId: 'a1', messageId: 'm' })
    _test_drainNow()
    for (const part of slice.messages[0]!.parts) {
      expect((part as { state?: string }).state).toBe('complete')
    }
  })

  test('increment-inflight clamps to zero on over-decrement', () => {
    const { slice } = makeSlice()
    expect(slice.inFlightToolCount).toBe(0)
    enqueue({ kind: 'increment-inflight', agentId: 'a1', delta: 1 })
    enqueue({ kind: 'increment-inflight', agentId: 'a1', delta: 1 })
    _test_drainNow()
    expect(slice.inFlightToolCount).toBe(2)
    enqueue({ kind: 'increment-inflight', agentId: 'a1', delta: -5 })
    _test_drainNow()
    expect(slice.inFlightToolCount).toBe(0)
  })

  test('cap drops oldest op when queue exceeds MAX_QUEUE_SIZE', () => {
    const { slice } = makeSlice()
    // First enqueue seeds the message, then we flood with 1000+ deltas.
    // The cap shifts the oldest out, so eventually message-start itself
    // gets dropped. The deltas then no-op against a non-existent message.
    enqueue({ kind: 'message-start', agentId: 'a1', messageId: 'm', role: 'assistant' })
    for (let i = 0; i < 1005; i += 1) {
      enqueue({
        kind: 'append-delta',
        agentId: 'a1',
        messageId: 'm',
        partType: 'text',
        delta: 'x',
      })
    }
    // 1006 ops enqueued but the cap is 1000, so the queue holds the
    // newest 1000 ops. The oldest 6 ops (message-start + first 5 deltas)
    // were shifted off; the surviving 1000 are all append-deltas that
    // reference a message that no longer exists.
    expect(pendingOpsCount('a1')).toBe(1000)
    expect(() => _test_drainNow()).not.toThrow()
    // After drain, the surviving deltas have no message to apply to.
    expect(slice.messages).toHaveLength(0)
  })

  test('no-op when drain runs with empty queues', () => {
    const { getNotifyCount } = makeSlice()
    expect(() => _test_drainNow()).not.toThrow()
    expect(getNotifyCount()).toBe(0)
  })

  test('ops with unknown messageId are silently dropped', () => {
    const { slice } = makeSlice()
    enqueue({
      kind: 'append-delta',
      agentId: 'a1',
      messageId: 'nonexistent',
      partType: 'text',
      delta: 'orphan',
    })
    expect(() => _test_drainNow()).not.toThrow()
    expect(slice.messages).toHaveLength(0)
  })

  test('QUEUE_TICK_MS is exported as 50', () => {
    expect(QUEUE_TICK_MS).toBe(50)
  })

  test('end-to-end: message-start → text-deltas → finalize → next-message-start', () => {
    const { slice, getNotifyCount } = makeSlice()
    enqueue({ kind: 'message-start', agentId: 'a1', messageId: 'm1', role: 'user' })
    enqueue({
      kind: 'append-delta',
      agentId: 'a1',
      messageId: 'm1',
      partType: 'text',
      delta: 'hi',
    })
    enqueue({ kind: 'message-start', agentId: 'a1', messageId: 'm2', role: 'assistant' })
    enqueue({
      kind: 'append-part',
      agentId: 'a1',
      messageId: 'm2',
      part: { type: 'thinking', text: 'plan', state: 'streaming' },
    })
    enqueue({
      kind: 'finalize-part',
      agentId: 'a1',
      messageId: 'm2',
      partType: 'thinking',
      content: 'plan-done',
    })
    enqueue({
      kind: 'append-delta',
      agentId: 'a1',
      messageId: 'm2',
      partType: 'text',
      delta: 'reply',
    })
    enqueue({ kind: 'finalize-message', agentId: 'a1', messageId: 'm2' })

    _test_drainNow()

    expect(slice.messages).toHaveLength(2)
    expect(slice.messages[0]!.role).toBe('user')
    expect(slice.messages[1]!.role).toBe('assistant')
    expect(slice.messages[0]!.parts[0]).toEqual({ type: 'text', text: 'hi', state: 'streaming' })
    expect(slice.messages[1]!.parts[0]).toEqual({
      type: 'thinking',
      text: 'plan-done',
      state: 'complete',
    })
    expect(slice.messages[1]!.parts[1]).toEqual({ type: 'text', text: 'reply', state: 'complete' })
    expect(getNotifyCount()).toBe(1)
  })

  test('StreamOp discriminated union is exhaustive', () => {
    const ops: StreamOp[] = [
      { kind: 'message-start', agentId: 'a1', messageId: 'm', role: 'assistant' },
      { kind: 'append-part', agentId: 'a1', messageId: 'm', part: { type: 'text', text: '', state: 'streaming' } },
      { kind: 'append-delta', agentId: 'a1', messageId: 'm', partType: 'text', delta: '' },
      { kind: 'append-tool-call-delta', agentId: 'a1', messageId: 'm', toolCallId: 'tc', delta: '' },
      { kind: 'finalize-part', agentId: 'a1', messageId: 'm', partType: 'text' },
      { kind: 'finalize-tool-call', agentId: 'a1', messageId: 'm', toolCallId: 'tc', args: null },
      { kind: 'finalize-message', agentId: 'a1', messageId: 'm' },
      { kind: 'increment-inflight', agentId: 'a1', delta: 0 },
    ]
    expect(ops).toHaveLength(8)
    for (const op of ops) {
      expect(op.kind).toBeTypeOf('string')
    }
  })
})

describe('hasStreamingState', () => {
  test('returns true when any text part is streaming', () => {
    const msg: RuntimeMessage = {
      id: 'm',
      role: 'assistant',
      parts: [{ type: 'text', text: 'in-flight', state: 'streaming' }],
      activityTimeline: [],
      response: [],
      ts: 0,
    }
    expect(hasStreamingState(msg)).toBe(true)
  })

  test('returns true when any thinking part is streaming', () => {
    const msg: RuntimeMessage = {
      id: 'm',
      role: 'assistant',
      parts: [{ type: 'thinking', text: 'in-flight', state: 'streaming' }],
      activityTimeline: [],
      response: [],
      ts: 0,
    }
    expect(hasStreamingState(msg)).toBe(true)
  })

  test('returns true when a tool-call is pending', () => {
    const msg: RuntimeMessage = {
      id: 'm',
      role: 'assistant',
      parts: [{ type: 'tool-call', id: 'tc', name: 'bash', args: undefined, state: 'pending' }],
      activityTimeline: [],
      response: [],
      ts: 0,
    }
    expect(hasStreamingState(msg)).toBe(true)
  })

  test('returns true when a tool-call is streaming-args', () => {
    const msg: RuntimeMessage = {
      id: 'm',
      role: 'assistant',
      parts: [{ type: 'tool-call', id: 'tc', name: 'bash', args: '{}', state: 'streaming-args' }],
      activityTimeline: [],
      response: [],
      ts: 0,
    }
    expect(hasStreamingState(msg)).toBe(true)
  })

  test('returns true when a tool-result is pending', () => {
    const msg: RuntimeMessage = {
      id: 'm',
      role: 'assistant',
      parts: [{ type: 'tool-result', id: 'tc', name: '', result: [], isError: false, state: 'pending' }],
      activityTimeline: [],
      response: [],
      ts: 0,
    }
    expect(hasStreamingState(msg)).toBe(true)
  })

  test('returns false when all parts are complete', () => {
    const msg: RuntimeMessage = {
      id: 'm',
      role: 'assistant',
      parts: [
        { type: 'text', text: 'done', state: 'complete' },
        { type: 'thinking', text: 'thought', state: 'complete' },
        { type: 'tool-call', id: 'tc', name: 'bash', args: {}, state: 'complete' },
      ],
      activityTimeline: [],
      response: [],
      ts: 0,
    }
    expect(hasStreamingState(msg)).toBe(false)
  })

  test('returns false for empty parts', () => {
    expect(hasStreamingState({ id: 'm', role: 'assistant', parts: [], activityTimeline: [], response: [], ts: 0 })).toBe(false)
  })

  test('returns false for image and compaction-summary parts', () => {
    const msg: RuntimeMessage = {
      id: 'm',
      role: 'assistant',
      parts: [
        { type: 'image', data: 'b64', mimeType: 'image/svg+xml' },
        { type: 'compaction-summary', tokensBefore: 0, summary: 'sum' },
      ],
      activityTimeline: [],
      response: [],
      ts: 0,
    }
    expect(hasStreamingState(msg)).toBe(false)
  })
})

describe('mergeMessagesPreserveStreaming', () => {
  const a = (id: string, parts: RuntimeMessage['parts']): RuntimeMessage => ({
    id,
    role: 'assistant',
    parts,
    activityTimeline: [],
    response: [],
    ts: 0,
  })

  test('appends incoming ids at the end, preserving existing order', () => {
    const existing = [a('x', []), a('y', [])]
    const incoming = [a('z', [{ type: 'text', text: 'new', state: 'complete' }])]
    const merged = mergeMessagesPreserveStreaming(existing, incoming)
    expect(merged.map((m) => m.id)).toEqual(['x', 'y', 'z'])
  })

  test('keeps existing streaming version over non-streaming incoming', () => {
    const existing = [
      a('x', [{ type: 'text', text: 'live', state: 'streaming' }]),
    ]
    const incoming = [a('x', [{ type: 'text', text: 'stale', state: 'complete' }])]
    const merged = mergeMessagesPreserveStreaming(existing, incoming)
    expect(merged).toHaveLength(1)
    expect(merged[0]!.parts[0]).toMatchObject({ text: 'live', state: 'streaming' })
  })

  test('uses incoming version when existing has no streaming state', () => {
    const existing = [a('x', [{ type: 'text', text: 'old', state: 'complete' }])]
    const incoming = [a('x', [{ type: 'text', text: 'new', state: 'complete' }])]
    const merged = mergeMessagesPreserveStreaming(existing, incoming)
    expect(merged).toHaveLength(1)
    expect(merged[0]!.parts[0]).toMatchObject({ text: 'new' })
  })

  test('uses incoming when both have streaming state', () => {
    const existing = [
      a('x', [{ type: 'text', text: 'live-old', state: 'streaming' }]),
    ]
    const incoming = [a('x', [{ type: 'text', text: 'live-new', state: 'streaming' }])]
    const merged = mergeMessagesPreserveStreaming(existing, incoming)
    expect(merged[0]!.parts[0]).toMatchObject({ text: 'live-new' })
  })

  test('dedupes incoming by id, last-write-wins', () => {
    const incoming = [
      a('x', [{ type: 'text', text: 'first', state: 'complete' }]),
      a('x', [{ type: 'text', text: 'second', state: 'complete' }]),
    ]
    const merged = mergeMessagesPreserveStreaming([], incoming)
    expect(merged).toHaveLength(1)
    expect(merged[0]!.parts[0]).toMatchObject({ text: 'second' })
  })

  test('preserves existing ids that are not in incoming', () => {
    const existing = [a('x', []), a('y', []), a('z', [])]
    const incoming = [a('y', [{ type: 'text', text: 'updated', state: 'complete' }])]
    const merged = mergeMessagesPreserveStreaming(existing, incoming)
    expect(merged.map((m) => m.id)).toEqual(['x', 'y', 'z'])
    expect(merged[1]!.parts[0]).toMatchObject({ text: 'updated' })
  })
})

describe('finalize-tool-result', () => {
  test('inserts a tool-result part after the matching tool-call', () => {
    const { slice } = makeSlice()
    enqueue({ kind: 'message-start', agentId: 'a1', messageId: 'm', role: 'assistant' })
    enqueue({
      kind: 'append-part',
      agentId: 'a1',
      messageId: 'm',
      part: { type: 'tool-call', id: 'tc1', name: 'bash', args: { command: 'ls' }, state: 'complete' },
    })
    enqueue({
      kind: 'finalize-tool-result',
      agentId: 'a1',
      toolCallId: 'tc1',
      result: [{ type: 'text', text: 'file.txt' }],
      isError: false,
    })
    _test_drainNow()

    const parts = slice.messages[0]!.parts
    expect(parts).toHaveLength(2)
    expect(parts[0]!.type).toBe('tool-call')
    expect(parts[1]!.type).toBe('tool-result')
    const resultPart = parts[1] as Extract<typeof parts[1], { type: 'tool-result' }>
    expect(resultPart.state).toBe('complete')
    expect(resultPart.result).toEqual([{ type: 'text', text: 'file.txt' }])
    expect(resultPart.isError).toBe(false)
  })

  test('replaces an existing streaming tool-result part', () => {
    const { slice } = makeSlice()
    enqueue({ kind: 'message-start', agentId: 'a1', messageId: 'm', role: 'assistant' })
    enqueue({
      kind: 'append-part',
      agentId: 'a1',
      messageId: 'm',
      part: { type: 'tool-call', id: 'tc1', name: 'bash', args: {}, state: 'complete' },
    })
    enqueue({
      kind: 'append-part',
      agentId: 'a1',
      messageId: 'm',
      part: {
        type: 'tool-result',
        id: 'tc1',
        name: '',
        result: [{ type: 'text', text: 'partial' }],
        isError: false,
        state: 'streaming',
      },
    })
    enqueue({
      kind: 'finalize-tool-result',
      agentId: 'a1',
      toolCallId: 'tc1',
      result: [{ type: 'text', text: 'final' }],
      isError: false,
    })
    _test_drainNow()

    const parts = slice.messages[0]!.parts
    expect(parts).toHaveLength(2)
    const resultPart = parts[1] as Extract<typeof parts[1], { type: 'tool-result' }>
    expect(resultPart.state).toBe('complete')
    expect(resultPart.result).toEqual([{ type: 'text', text: 'final' }])
  })

  test('finds the tool-call across multiple messages', () => {
    const { slice } = makeSlice()
    enqueue({ kind: 'message-start', agentId: 'a1', messageId: 'm1', role: 'assistant' })
    enqueue({
      kind: 'append-part',
      agentId: 'a1',
      messageId: 'm1',
      part: { type: 'tool-call', id: 'tc1', name: 'bash', args: {}, state: 'complete' },
    })
    enqueue({ kind: 'message-start', agentId: 'a1', messageId: 'm2', role: 'assistant' })
    enqueue({
      kind: 'append-part',
      agentId: 'a1',
      messageId: 'm2',
      part: { type: 'text', text: 'hi', state: 'complete' },
    })
    enqueue({
      kind: 'finalize-tool-result',
      agentId: 'a1',
      toolCallId: 'tc1',
      result: [{ type: 'text', text: 'ok' }],
      isError: false,
    })
    _test_drainNow()

    expect(slice.messages[0]!.parts).toHaveLength(2)
    expect(slice.messages[1]!.parts).toHaveLength(1)
    const parts = slice.messages[0]!.parts
    const resultPart = parts[1] as Extract<typeof parts[1], { type: 'tool-result' }>
    expect(resultPart.result).toEqual([{ type: 'text', text: 'ok' }])
  })

  test('is a no-op when no message contains the tool-call', () => {
    const { slice } = makeSlice()
    enqueue({ kind: 'message-start', agentId: 'a1', messageId: 'm', role: 'assistant' })
    enqueue({
      kind: 'finalize-tool-result',
      agentId: 'a1',
      toolCallId: 'missing',
      result: [{ type: 'text', text: 'ok' }],
      isError: false,
    })
    _test_drainNow()
    expect(slice.messages[0]!.parts).toHaveLength(0)
  })

  test('sets isError on the result part', () => {
    const { slice } = makeSlice()
    enqueue({ kind: 'message-start', agentId: 'a1', messageId: 'm', role: 'assistant' })
    enqueue({
      kind: 'append-part',
      agentId: 'a1',
      messageId: 'm',
      part: { type: 'tool-call', id: 'tc1', name: 'bash', args: {}, state: 'complete' },
    })
    enqueue({
      kind: 'finalize-tool-result',
      agentId: 'a1',
      toolCallId: 'tc1',
      result: [{ type: 'text', text: 'failed' }],
      isError: true,
    })
    _test_drainNow()
    const parts = slice.messages[0]!.parts
    const resultPart = parts[1] as Extract<typeof parts[1], { type: 'tool-result' }>
    expect(resultPart.isError).toBe(true)
  })
})

describe('set-messages', () => {
  test('merges incoming messages into the slice', () => {
    const { slice } = makeSlice()
    enqueue({ kind: 'set-messages', agentId: 'a1', messages: [
      {
        id: 'x',
        role: 'assistant',
        parts: [{ type: 'text', text: 'hi', state: 'complete' }],
      activityTimeline: [],
      response: [],
      ts: 0,
      },
    ] })
    _test_drainNow()
    expect(slice.messages).toHaveLength(1)
    expect(slice.messages[0]!.parts[0]).toMatchObject({ text: 'hi' })
  })

  test('preserves in-flight streaming state over stale complete incoming', () => {
    const { slice } = makeSlice()
    enqueue({ kind: 'set-messages', agentId: 'a1', messages: [
      {
        id: 'x',
        role: 'assistant',
        parts: [{ type: 'text', text: 'stale', state: 'complete' }],
      activityTimeline: [],
      response: [],
      ts: 0,
      },
    ] })
    _test_drainNow()

    enqueue({ kind: 'set-messages', agentId: 'a1', messages: [
      {
        id: 'x',
        role: 'assistant',
        parts: [{ type: 'text', text: 'stale', state: 'complete' }],
      activityTimeline: [],
      response: [],
      ts: 0,
      },
    ] })
    enqueue({
      kind: 'append-delta',
      agentId: 'a1',
      messageId: 'x',
      partType: 'text',
      delta: ' live',
    })
    enqueue({ kind: 'set-messages', agentId: 'a1', messages: [
      {
        id: 'x',
        role: 'assistant',
        parts: [{ type: 'text', text: 'stale', state: 'complete' }],
      activityTimeline: [],
      response: [],
      ts: 0,
      },
    ] })
    _test_drainNow()
    const part = slice.messages[0]!.parts[0] as { text: string; state?: string }
    expect(part.text).toBe('stale live')
    expect(part.state).toBe('streaming')
  })

  test('drops oldest rows beyond MAX_QUEUE_MESSAGES', () => {
    const { slice } = makeSlice()
    const incoming: RuntimeMessage[] = []
    for (let i = 0; i < 5005; i += 1) {
      incoming.push({
        id: `m-${i}`,
        role: 'assistant',
        parts: [{ type: 'text', text: `${i}`, state: 'complete' }],
      activityTimeline: [],
      response: [],
      ts: i,
      })
    }
    enqueue({ kind: 'set-messages', agentId: 'a1', messages: incoming })
    _test_drainNow()
    expect(slice.messages).toHaveLength(5000)
    expect(slice.messages[0]!.id).toBe('m-5')
    expect(slice.messages[4999]!.id).toBe('m-5004')
  })

  test('appends new ids at the end', () => {
    const { slice } = makeSlice()
    enqueue({ kind: 'set-messages', agentId: 'a1', messages: [
      { id: 'x', role: 'assistant', parts: [], activityTimeline: [], response: [], ts: 0 },
    ] })
    _test_drainNow()
    enqueue({ kind: 'set-messages', agentId: 'a1', messages: [
      { id: 'x', role: 'assistant', parts: [], activityTimeline: [], response: [], ts: 0 },
      { id: 'y', role: 'assistant', parts: [], activityTimeline: [], response: [], ts: 1 },
    ] })
    _test_drainNow()
    expect(slice.messages.map((m) => m.id)).toEqual(['x', 'y'])
  })

  test('dedupes incoming by id, last-write-wins', () => {
    const { slice } = makeSlice()
    enqueue({ kind: 'set-messages', agentId: 'a1', messages: [
      {
        id: 'x',
        role: 'assistant',
        parts: [{ type: 'text', text: 'first', state: 'complete' }],
      activityTimeline: [],
      response: [],
      ts: 0,
      },
      {
        id: 'x',
        role: 'assistant',
        parts: [{ type: 'text', text: 'second', state: 'complete' }],
      activityTimeline: [],
      response: [],
      ts: 1,
      },
    ] })
    _test_drainNow()
    expect(slice.messages).toHaveLength(1)
    expect(slice.messages[0]!.parts[0]).toMatchObject({ text: 'second' })
  })
})

describe('append-compaction-summary', () => {
  test('appends a compaction-summary card to the most recent assistant message', () => {
    const { slice } = makeSlice()
    enqueue({ kind: 'message-start', agentId: 'a1', messageId: 'u', role: 'user' })
    enqueue({
      kind: 'append-part',
      agentId: 'a1',
      messageId: 'u',
      part: { type: 'text', text: 'hello', state: 'complete' },
    })
    enqueue({ kind: 'message-start', agentId: 'a1', messageId: 'a', role: 'assistant' })
    enqueue({
      kind: 'append-part',
      agentId: 'a1',
      messageId: 'a',
      part: { type: 'text', text: 'reply', state: 'complete' },
    })
    enqueue({
      kind: 'append-compaction-summary',
      agentId: 'a1',
      summary: 'context summary text',
      tokensBefore: 124000,
    })
    _test_drainNow()

    const parts = slice.messages[1]!.parts
    expect(parts).toHaveLength(2)
    expect(parts[1]).toEqual({
      type: 'compaction-summary',
      tokensBefore: 124000,
      summary: 'context summary text',
    })
  })

  test('skips user messages when finding the target', () => {
    const { slice } = makeSlice()
    enqueue({ kind: 'message-start', agentId: 'a1', messageId: 'a1', role: 'assistant' })
    enqueue({
      kind: 'append-part',
      agentId: 'a1',
      messageId: 'a1',
      part: { type: 'text', text: 'first', state: 'complete' },
    })
    enqueue({ kind: 'message-start', agentId: 'a1', messageId: 'u', role: 'user' })
    enqueue({
      kind: 'append-part',
      agentId: 'a1',
      messageId: 'u',
      part: { type: 'text', text: 'user', state: 'complete' },
    })
    enqueue({
      kind: 'append-compaction-summary',
      agentId: 'a1',
      summary: 'sum',
      tokensBefore: 0,
    })
    _test_drainNow()
    expect(slice.messages[0]!.parts).toHaveLength(2)
    expect(slice.messages[0]!.parts[1]!.type).toBe('compaction-summary')
  })

  test('is a no-op when no assistant message exists', () => {
    const { slice } = makeSlice()
    enqueue({ kind: 'message-start', agentId: 'a1', messageId: 'u', role: 'user' })
    enqueue({
      kind: 'append-part',
      agentId: 'a1',
      messageId: 'u',
      part: { type: 'text', text: 'hi', state: 'complete' },
    })
    enqueue({
      kind: 'append-compaction-summary',
      agentId: 'a1',
      summary: 'sum',
      tokensBefore: 0,
    })
    _test_drainNow()
    expect(slice.messages).toHaveLength(1)
    expect(slice.messages[0]!.parts).toHaveLength(1)
  })
})
