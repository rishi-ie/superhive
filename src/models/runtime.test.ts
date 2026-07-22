/**
 * Phase 15.1 — pure-function tests for message-shape helpers.
 *
 * Phase A scope: tests for the in-memory `RuntimeAssistantState` helpers.
 * The persisted `AssistantMessage` lives in `assistant-message.ts` and has
 * its own helpers (`getAssistantMessageText`, etc.).
 *
 * Run via `bun test src/models/runtime.test.ts`.
 */

import { describe, expect, test } from 'bun:test'
import {
  getMessageText,
  getMessageTailFingerprint,
  isMessageInFlight,
  type RuntimeAssistantState,
} from './runtime'

const mkMsg = (parts: RuntimeAssistantState['parts']): RuntimeAssistantState => ({
  id: 'm',
  role: 'user',
  parts,
  activityTimeline: [],
  response: [],
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

describe('isMessageInFlight', () => {
  test('returns false when frozen', () => {
    const m: RuntimeAssistantState = {
      id: 'm',
      role: 'assistant',
      parts: [{ type: 'text', text: 'in-flight', state: 'streaming' }],
      activityTimeline: [],
      response: [],
      ts: 0,
      frozen: true,
    }
    expect(isMessageInFlight(m)).toBe(false)
  })

  test('returns true when any text part is streaming', () => {
    expect(
      isMessageInFlight(
        mkMsg([{ type: 'text', text: 'in-flight', state: 'streaming' }]),
      ),
    ).toBe(true)
  })

  test('returns true when any thinking part is streaming', () => {
    expect(
      isMessageInFlight(
        mkMsg([{ type: 'thinking', text: 'in-flight', state: 'streaming' }]),
      ),
    ).toBe(true)
  })

  test('returns true when a tool-call is pending', () => {
    expect(
      isMessageInFlight(
        mkMsg([
          { type: 'tool-call', id: 'tc', name: 'bash', args: undefined, state: 'pending' },
        ]),
      ),
    ).toBe(true)
  })

  test('returns false when all parts are complete and frozen', () => {
    expect(
      isMessageInFlight({
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
        frozen: true,
      }),
    ).toBe(false)
  })

  test('returns false for empty parts', () => {
    expect(isMessageInFlight(mkMsg([]))).toBe(false)
  })
})
