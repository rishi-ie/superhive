/**
 * Phase 15.1 — pure-function tests for message-shape helpers.
 *
 * Run via `bun test src/models/runtime.test.ts`.
 */

import { describe, expect, test } from 'bun:test'
import {
  getMessageText,
  getMessageTailFingerprint,
  type RuntimeMessage,
} from './runtime'

const mkMsg = (parts: RuntimeMessage['parts']): RuntimeMessage => ({
  id: 'm',
  role: 'user',
  parts,
  ts: 1,
})

describe('getMessageText', () => {
  test('joins text and thinking parts with a blank line', () => {
    const out = getMessageText(
      mkMsg([
        { type: 'text', text: 'hi', state: 'complete' },
        { type: 'thinking', text: 'plan', state: 'complete' },
        { type: 'text', text: 'there', state: 'complete' },
      ]),
    )
    expect(out).toBe('hi\n\nplan\n\nthere')
  })

  test('ignores tool-call parts (prose-only view)', () => {
    const out = getMessageText(
      mkMsg([
        { type: 'text', text: 'before' },
        {
          type: 'tool-call',
          id: 't',
          name: 'bash',
          args: {},
          state: 'complete',
        },
        { type: 'text', text: 'after' },
      ]),
    )
    expect(out).toBe('before\n\nafter')
  })
})

describe('getMessageTailFingerprint', () => {
  test('returns the text of the last text/thinking part', () => {
    expect(
      getMessageTailFingerprint(
        mkMsg([{ type: 'text', text: 'a' }, { type: 'text', text: 'final' }]),
      ),
    ).toBe('final')
  })

  test('returns a discriminator for non-text tail parts', () => {
    expect(
      getMessageTailFingerprint(
        mkMsg([{ type: 'image', data: 'x', mimeType: 'image/png' }]),
      ),
    ).toBe('__image')
  })

  test('returns empty string for an empty message', () => {
    expect(getMessageTailFingerprint(mkMsg([]))).toBe('')
  })
})

describe('parseDiff', () => {
  test('emits add/remove/context rows with line numbers', async () => {
    const { parseDiff } = await import(
      '@/pages/agent-chat/components/message-parts/DiffView'
    )
    const rows = parseDiff(
      [
        '--- a/foo',
        '+++ b/foo',
        '@@ -1,2 +1,2 @@',
        ' unchanged',
        '-old',
        '+new',
      ].join('\n'),
    )
    // 3 rows: context "unchanged", remove "old", add "new"
    expect(rows).toHaveLength(3)
    expect(rows[0].type).toBe('context')
    expect(rows[1].type).toBe('remove')
    expect(rows[2].type).toBe('add')
  })

  test('parses abbreviated diffs without --- / +++ headers', async () => {
    const { parseDiff } = await import(
      '@/pages/agent-chat/components/message-parts/DiffView'
    )
    const rows = parseDiff(
      ['@@ -10 +10 @@', '-a', '+b'].join('\n'),
    )
    expect(rows).toHaveLength(2)
    expect(rows.map((r) => r.type)).toEqual(['remove', 'add'])
    // Both rows should have null line numbers (no preceding hunk anchors
    // beyond the @@ -10 +10 — but the parser doesn't decrement after
    // the hunk; the add row does carry newLine).
    expect(rows[1].newLine).toBe(10)
  })

  test('returns one empty context row for an empty input', async () => {
    const { parseDiff } = await import(
      '@/pages/agent-chat/components/message-parts/DiffView'
    )
    // An empty string yields a single context row with empty content;
    // the renderer collapses this visually anyway. The fallback is
    // specifically for non-diff text, which we test below.
    const rows = parseDiff('')
    expect(rows).toHaveLength(1)
    expect(rows[0].type).toBe('context')
    expect(rows[0].content).toBe('')
  })

  test('treats prose lines as context rows (graceful fallback)', async () => {
    const { parseDiff } = await import(
      '@/pages/agent-chat/components/message-parts/DiffView'
    )
    const rows = parseDiff('just some prose\nno diff here')
    expect(rows).toHaveLength(2)
    expect(rows.every((r) => r.type === 'context')).toBe(true)
  })
})
