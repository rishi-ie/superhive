import { afterEach, beforeEach, describe, expect, jest, test } from 'bun:test'
import { copyMessage } from './copy-message'
import type { RuntimeMessage } from '@/models/runtime'

function makeMessage(role: 'user' | 'assistant', parts: RuntimeMessage['parts']): RuntimeMessage {
  return { id: 'm1', role, parts, ts: 1 }
}

let writeStub: ReturnType<typeof jest.fn>

beforeEach(() => {
  writeStub = jest.fn(async (_text: string) => undefined)
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    configurable: true,
    value: { writeText: writeStub },
  })
})
afterEach(() => {
  jest.restoreAllMocks()
})

describe('copyMessage', () => {
  test('copies a user message verbatim', async () => {
    const msg = makeMessage('user', [{ type: 'text', text: 'hello world' }])
    const ok = await copyMessage(msg)
    expect(ok).toBe(true)
    expect(writeStub).toHaveBeenCalledTimes(1)
    expect(writeStub.mock.calls[0]?.[0]).toBe('hello world')
  })

  test('joins assistant text parts with a blank line and excludes everything else', async () => {
    const msg = makeMessage('assistant', [
      { type: 'thinking', text: 'reasoning here', state: 'complete' },
      { type: 'text', text: 'first reply', state: 'complete' },
      {
        type: 'tool-call',
        id: 't1',
        name: 'read',
        args: { path: '/x' },
        state: 'complete',
      },
      {
        type: 'tool-result',
        id: 't1',
        name: 'read',
        result: [{ type: 'text', text: 'file contents' }],
        isError: false,
        state: 'complete',
      },
      { type: 'text', text: 'second reply', state: 'complete' },
    ])
    const ok = await copyMessage(msg)
    expect(ok).toBe(true)
    expect(writeStub.mock.calls[0]?.[0]).toBe('first reply\n\nsecond reply')
  })

  test('does not include thinking or compaction summaries', async () => {
    const msg = makeMessage('assistant', [
      { type: 'thinking', text: 'should not copy', state: 'complete' },
      {
        type: 'compaction-summary',
        tokensBefore: 100,
        summary: 'should not copy',
      },
      { type: 'text', text: 'visible answer', state: 'complete' },
    ])
    await copyMessage(msg)
    expect(writeStub.mock.calls[0]?.[0]).toBe('visible answer')
  })

  test('returns false and writes nothing when assistant has no text parts', async () => {
    const msg = makeMessage('assistant', [
      { type: 'thinking', text: 'only thinking', state: 'complete' },
      {
        type: 'tool-call',
        id: 't1',
        name: 'read',
        args: {},
        state: 'complete',
      },
    ])
    const ok = await copyMessage(msg)
    expect(ok).toBe(true)
    expect(writeStub.mock.calls[0]?.[0]).toBe('')
  })

  test('returns false on clipboard failure', async () => {
    writeStub = jest.fn(async () => {
      throw new Error('denied')
    })
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: { writeText: writeStub },
    })
    const msg = makeMessage('user', [{ type: 'text', text: 'hi' }])
    const ok = await copyMessage(msg)
    expect(ok).toBe(false)
  })
})
