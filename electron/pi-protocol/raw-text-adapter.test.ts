/**
 * Phase 15.1 — RawTextAdapter unit tests. Stdin -> JSON -> AdapterEvent
 * mapping is the lowest-level protocol boundary; we test it directly with
 * mocked JSONL chunks.
 *
 * Run via `bun test electron/pi-protocol/raw-text-adapter.test.ts`.
 */

import { describe, expect, test } from 'bun:test'
import { RawTextAdapter } from './raw-text-adapter'
import type { AdapterEvent } from './types'

function capture(adapter: RawTextAdapter): AdapterEvent[] {
  const out: AdapterEvent[] = []
  adapter.onStdout('', (ev) => out.push(ev))
  return out
}

describe('RawTextAdapter.onStdout', () => {
  test('emits text-delta after auto message-start, then message-end', () => {
    const adapter = new RawTextAdapter()
    const out = capture(adapter)
    adapter.onStdout(
      JSON.stringify({
        type: 'message_update',
        assistantMessageEvent: { type: 'text_delta', delta: 'hel' },
      }) + '\n',
      (ev) => out.push(ev),
    )
    adapter.onStdout(
      JSON.stringify({
        type: 'message_update',
        assistantMessageEvent: { type: 'text_delta', delta: 'lo' },
      }) + '\n',
      (ev) => out.push(ev),
    )
    adapter.onStdout(
      JSON.stringify({
        type: 'message_end',
      }) + '\n',
      (ev) => out.push(ev),
    )
    const types = out.map((e) => e.type)
    expect(types).toContain('message-start')
    expect(types.filter((t) => t === 'text-delta')).toHaveLength(2)
    expect(types[types.length - 1]!).toBe('message-end')
  })

  test('emits thinking-start / thinking-delta / thinking-end', () => {
    const adapter = new RawTextAdapter()
    const out: AdapterEvent[] = []
    const emit = (ev: AdapterEvent) => out.push(ev)
    adapter.onStdout(
      JSON.stringify({
        type: 'message_update',
        assistantMessageEvent: { type: 'thinking_start' },
      }) + '\n',
      emit,
    )
    adapter.onStdout(
      JSON.stringify({
        type: 'message_update',
        assistantMessageEvent: { type: 'thinking_delta', delta: '…' },
      }) + '\n',
      emit,
    )
    adapter.onStdout(
      JSON.stringify({
        type: 'message_update',
        assistantMessageEvent: { type: 'thinking_end', content: 'decided' },
      }) + '\n',
      emit,
    )
    // The adapter auto-emits a `message-start` before the first delta.
    expect(out.map((e) => e.type)).toEqual([
      'message-start',
      'thinking-start',
      'thinking-delta',
      'thinking-end',
    ])
  })

  test('emits log event for non-JSON lines', () => {
    const adapter = new RawTextAdapter()
    const out: AdapterEvent[] = []
    adapter.onStdout('not-json\n', (ev) => out.push(ev))
    expect(out).toHaveLength(1)
    expect(out[0]!.type).toBe('log')
  })

  test('handles chunked JSONL across multiple stdout writes', () => {
    const adapter = new RawTextAdapter()
    const out: AdapterEvent[] = []
    const emit = (ev: AdapterEvent) => out.push(ev)
    // Split a single JSON envelope across two writes.
    const full = JSON.stringify({
      type: 'message_update',
      assistantMessageEvent: { type: 'text_delta', delta: 'X' },
    }) + '\n'
    const half1 = full.slice(0, 30)
    const half2 = full.slice(30)
    adapter.onStdout(half1, emit)
    adapter.onStdout(half2, emit)
    const types = out.map((e) => e.type)
    expect(types).toContain('message-start')
    expect(types).toContain('text-delta')
  })
})

describe('RawTextAdapter.serializeInput', () => {
  test('wraps text in `prompt` JSON envelope with `message` field', () => {
    const adapter = new RawTextAdapter()
    const wire = adapter.serializeInput('hello')
    expect(wire.trim()).toBe(JSON.stringify({ type: 'prompt', message: 'hello' }))
    expect(wire.endsWith('\n')).toBe(true)
  })
})
