import { expect, test } from 'bun:test'
import { translateEventToOps } from './event-translator'

test('keeps tool metadata on the queue operations that complete an audit row', () => {
  expect(translateEventToOps({ type: 'tool-call-end', messageId: 'message-1', toolCallId: 'call-read', name: 'read', args: { path: 'package.json' } }, 'agent-1')).toMatchObject([
    { kind: 'finalize-tool-call', toolCallId: 'call-read', name: 'read', args: { path: 'package.json' } },
  ])
  const executionOps = translateEventToOps({ type: 'tool-execution-end', toolCallId: 'call-read', name: 'read', result: { content: [{ type: 'text', text: 'ok' }] }, isError: false }, 'agent-1')
  expect(executionOps[1]).toMatchObject({ kind: 'finalize-tool-result', toolCallId: 'call-read', name: 'read' })
})
