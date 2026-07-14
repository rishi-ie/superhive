/**
 * Phase 15.1 — migration / data-shape tests for the chat persistence layer.
 *
 * Tests cover:
 *   1. Legacy rows (pre-Phase 1.4) with `content: string` get rewritten
 *      to `parts: ContentPart[]` via `migratePersistedMessage`.
 *   2. New-format rows round-trip untouched.
 *   3. Defensive handling of malformed rows (null, missing id, etc.) —
 *      `migratePersistedMessage` should return null so the caller drops
 *      the row instead of crashing.
 *
 * Run via `bun test electron/agent-chat-store.test.ts`.
 */

import { describe, expect, test } from 'bun:test'
import {
  migratePersistedMessage,
  replaceAll,
} from './agent-chat-store'
import { promises as fs } from 'node:fs'
void fs

describe('migratePersistedMessage', () => {
  test('rewrites legacy content: string into parts: [{type:"text"}]', () => {
    const out = migratePersistedMessage({
      id: 'm-1',
      role: 'user',
      content: 'Hello, world',
      ts: 1700000000,
    })
    expect(out).not.toBeNull()
    expect(out?.role).toBe('user')
    expect(out?.parts).toHaveLength(1)
    expect(out?.parts[0]).toEqual({ type: 'text', text: 'Hello, world', state: 'complete' })
  })

  test('passes through already-migrated rows', () => {
    const out = migratePersistedMessage({
      id: 'm-2',
      role: 'assistant',
      parts: [
        { type: 'text', text: 'hi', state: 'complete' },
        { type: 'thinking', text: 'plan', state: 'complete' },
      ],
      ts: 42,
    })
    expect(out?.parts).toHaveLength(2)
    expect(out?.ts).toBe(42)
  })

  test('preserves usage metadata when present', () => {
    const out = migratePersistedMessage({
      id: 'm-3',
      role: 'assistant',
      content: 'OK',
      ts: 1,
      usage: { input: 1, output: 2, cacheRead: 0, cacheWrite: 0, totalTokens: 3, cost: 0.01 },
    })
    expect(out?.usage?.cost).toBeCloseTo(0.01)
  })

  test('returns null when id is missing or input is not an object', () => {
    expect(migratePersistedMessage(null)).toBeNull()
    expect(migratePersistedMessage('garbage')).toBeNull()
    expect(migratePersistedMessage({})).toBeNull()
  })
})

describe('replaceAll', () => {
  test('rewrites the chat file atomically to the provided list', async () => {
    // AGENTS_CHAT_DIR is captured at module load (process.env.HOME), so we
    // can't redirect HOME for this test. Instead, work with the real path and
    // track file content via readAll() so we don't need to know the path
    // ourselves.
    const agentId = `replace-all-${Date.now()}`
    await replaceAll(agentId, [
      { id: 'x', role: 'user', parts: [{ type: 'text', text: 'A', state: 'complete' }], ts: 1 },
      { id: 'y', role: 'assistant', parts: [{ type: 'text', text: 'B', state: 'complete' }], ts: 2 },
    ])
    // Verify via migration / re-read; the test holds no hard-coded paths.
    const { readAll } = await import('./agent-chat-store')
    const msgs = await readAll(agentId)
    expect(msgs).toHaveLength(2)
    expect(msgs[0].id).toBe('x')
    expect(msgs[1].id).toBe('y')
  })
})
