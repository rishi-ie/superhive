/**
 * Regression tests for the `emitStatus` IPC payload boundary.
 *
 * Background: `RuntimeStatusPayload` declares `activeModelContextWindow?` and
 * `activeModelName?` so the renderer's context-window fallback chain in
 * AgentChatView / ProjectChatView can pick the active model's window on every
 * `model_select` event. The runtime was populating those fields on the entry
 * but never sending them over IPC, which made the ring fall through to "?"
 * for any model whose contextWindow was not in Pi's registry (e.g. custom
 * providers, hardcoded-only models like minimax:MiniMax-M3).
 *
 * These tests pin the payload shape — if either field is dropped from
 * `buildStatusPayload`, the tests fail.
 *
 * Run via `bun test electron/runtime-status.test.ts`.
 */

import { describe, expect, test } from 'bun:test'
import {
  buildStatusPayload,
  type RuntimeEntry,
} from './runtime-status'
import { RawTextAdapter } from './pi-protocol'

function makeEntry(overrides: Partial<RuntimeEntry> = {}): RuntimeEntry {
  return {
    agentId: 'agent-1',
    agentDir: '/tmp/agent-1',
    manifestPiSource: '/tmp/kai',
    process: null,
    messages: [],
    stderrLog: [],
    status: 'running',
    extensionLoaded: true,
    _chatPending: new Set(),
    _chatDebounceTimer: null,
    _inFlightTools: new Map(),
    adapter: new RawTextAdapter(),
    ...overrides,
  }
}

describe('buildStatusPayload', () => {
  test('includes activeModelContextWindow + activeModelName from the entry', () => {
    const payload = buildStatusPayload(
      makeEntry({
        activeModelContextWindow: 200_000,
        activeModelName: 'claude-sonnet-4-5',
      }),
      'agent-1',
    )
    expect(payload.activeModelContextWindow).toBe(200_000)
    expect(payload.activeModelName).toBe('claude-sonnet-4-5')
  })

  test('passes activeModelContextWindow through even when it is a hardcoded-only value (1M)', () => {
    // The exact case that motivated this fix: superhive-pi-telemetry's
    // HARDCODED_CONTEXT_WINDOWS table for minimax:MiniMax-M3 is 1_000_000.
    // Pi's own registry returns 0 for these models; the hardcoded value is
    // what makes the ring render the real window instead of "?".
    const payload = buildStatusPayload(
      makeEntry({
        activeModelContextWindow: 1_000_000,
        activeModelName: 'MiniMax-M3',
      }),
      'agent-1',
    )
    expect(payload.activeModelContextWindow).toBe(1_000_000)
    expect(payload.activeModelName).toBe('MiniMax-M3')
  })

  test('omits activeModelContextWindow + activeModelName when entry has none', () => {
    // Pre-session_start state — fields are still undefined on the entry.
    // The renderer must receive undefined (not a fabricated value) so its
    // fallback chain picks selectedContextWindow or contextUsage.contextWindow.
    const payload = buildStatusPayload(makeEntry(), 'agent-1')
    expect(payload.activeModelContextWindow).toBeUndefined()
    expect(payload.activeModelName).toBeUndefined()
  })

  test('forwards contextUsage unchanged', () => {
    // Sanity: the helper must not drop the other IPC fields it already
    // forwarded correctly. Guards against regressions where someone deletes
    // a different field while adding the new ones.
    const payload = buildStatusPayload(
      makeEntry({
        contextUsage: { tokens: 1234, contextWindow: 200_000, percent: 0.006 },
      }),
      'agent-1',
    )
    expect(payload.contextUsage).toEqual({
      tokens: 1234,
      contextWindow: 200_000,
      percent: 0.006,
    })
  })

  test('uses the agentId argument, not the entry.agentId', () => {
    // Defensive: callers pass the agentId explicitly so a stale entry's id
    // can never leak into the IPC channel name.
    const payload = buildStatusPayload(
      makeEntry({ agentId: 'stale-id' }),
      'fresh-id',
    )
    expect(payload.agentId).toBe('fresh-id')
  })
})