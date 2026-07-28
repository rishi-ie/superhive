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

test('bridges current Pi RPC messages into a live assistant response', () => {
  const adapter = new RawTextAdapter()
  const events: AdapterEvent[] = []
  const emit = (event: AdapterEvent) => events.push(event)

  adapter.onStdout(JSON.stringify({ type: 'agent_start' }) + '\n', emit)
  adapter.onStdout(JSON.stringify({ type: 'message_start', message: { role: 'assistant', content: [{ type: 'text', text: '' }] } }) + '\n', emit)
  adapter.onStdout(JSON.stringify({ type: 'message_end', message: { role: 'assistant', content: [{ type: 'text', text: 'Hello from Pi' }] } }) + '\n', emit)
  adapter.onStdout(JSON.stringify({ type: 'agent_end' }) + '\n', emit)

  const started = events.find((event) => event.type === 'message-start')
  expect(started).toMatchObject({ type: 'message-start', role: 'assistant' })
  const messageId = (started as Extract<AdapterEvent, { type: 'message-start' }>).messageId
  expect(events).toContainEqual({ type: 'text-delta', messageId, delta: 'Hello from Pi' })
  expect(events).toContainEqual({ type: 'text-end', messageId, contentIndex: 0, content: 'Hello from Pi' })
  expect(events).toContainEqual({ type: 'message-end', messageId })
  expect(events).toContainEqual({ type: 'agent-end' })
})

test('turns an empty direct provider result into an actionable UI error', () => {
  const adapter = new RawTextAdapter()
  const events: AdapterEvent[] = []
  const emit = (event: AdapterEvent) => events.push(event)

  adapter.onStdout(JSON.stringify({ type: 'agent_start' }) + '\n', emit)
  adapter.onStdout(JSON.stringify({ type: 'message_end', message: { role: 'assistant', content: [{ type: 'text', text: '' }] } }) + '\n', emit)

  expect(events).toContainEqual({
    type: 'error',
    message: 'The selected provider returned an empty response. Verify its model and credentials, then retry.',
    recoverable: true,
  })
})

test('recovers final-message thinking blocks when a provider does not stream them', () => {
  const adapter = new RawTextAdapter()
  const events: AdapterEvent[] = []
  adapter.onStdout(JSON.stringify({ type: 'agent_start' }) + '\n', (event) => events.push(event))
  adapter.onStdout(JSON.stringify({ type: 'message_end', message: { role: 'assistant', content: [
    { type: 'thinking', thinking: 'Checking the request.' },
    { type: 'text', text: 'Hello!' },
  ] } }) + '\n', (event) => events.push(event))

  expect(events.some((event) => event.type === 'thinking-delta' && event.delta === 'Checking the request.')).toBe(true)
  expect(events.some((event) => event.type === 'text-delta' && event.delta === 'Hello!')).toBe(true)
})

test('finalizes a failed prompt before Pi streams content', () => {
	const adapter = new RawTextAdapter()
	const events: AdapterEvent[] = []
	adapter.onStdout(JSON.stringify({ type: 'response', command: 'prompt', success: false, error: 'No API key found' }) + '\n', (event) => events.push(event))
	expect(events.map((event) => event.type)).toEqual(['message-start', 'error', 'message-end', 'agent-end'])
})
