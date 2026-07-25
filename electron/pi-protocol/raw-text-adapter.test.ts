import { expect, test } from 'bun:test'
import { RawTextAdapter } from './raw-text-adapter'
import type { AdapterEvent } from './types'

test('normalizes Pi tool metadata from its nested streaming payload', () => {
  const adapter = new RawTextAdapter()
  const events: AdapterEvent[] = []
  const emit = (event: AdapterEvent) => events.push(event)
  const partial = { content: [{ type: 'toolCall', id: 'call-read', name: 'read', arguments: {} }] }

  adapter.onStdout(`${JSON.stringify({ type: 'message_update', assistantMessageEvent: { type: 'toolcall_start', contentIndex: 0, partial } })}\n`, emit)
  adapter.onStdout(`${JSON.stringify({ type: 'message_update', assistantMessageEvent: { type: 'toolcall_delta', contentIndex: 0, delta: '{"path":"package.json"}', partial } })}\n`, emit)
  adapter.onStdout(`${JSON.stringify({ type: 'message_update', assistantMessageEvent: { type: 'toolcall_end', contentIndex: 0, toolCall: { id: 'call-read', name: 'read', arguments: { path: 'package.json' } }, partial } })}\n`, emit)
  adapter.onStdout(`${JSON.stringify({ type: 'tool_execution_start', toolCallId: 'call-read', toolName: 'read', args: { path: 'package.json' } })}\n`, emit)
  adapter.onStdout(`${JSON.stringify({ type: 'tool_execution_end', toolCallId: 'call-read', toolName: 'read', result: { content: [{ type: 'text', text: 'ok' }] }, isError: false })}\n`, emit)

  expect(events.find((event) => event.type === 'tool-call-start')).toMatchObject({ toolCallId: 'call-read', name: 'read' })
  expect(events.find((event) => event.type === 'tool-call-delta')).toMatchObject({ toolCallId: 'call-read' })
  expect(events.find((event) => event.type === 'tool-call-end')).toMatchObject({ toolCallId: 'call-read', name: 'read', args: { path: 'package.json' } })
  expect(events.find((event) => event.type === 'tool-execution-start')).toMatchObject({ toolCallId: 'call-read', name: 'read' })
  expect(events.find((event) => event.type === 'tool-execution-end')).toMatchObject({ toolCallId: 'call-read', name: 'read' })
})
