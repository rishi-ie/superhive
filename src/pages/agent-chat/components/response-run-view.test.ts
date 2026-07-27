import { expect, test } from 'bun:test'
import { buildResponseRunView } from './response-run-view'

test('keeps only the latest status until prose gives it history', () => {
  const view = buildResponseRunView(
    [
      { kind: 'thinking', id: 'thought', text: '', state: 'complete', startedAt: 1, endedAt: 2, sequence: 0 },
      { kind: 'tool-call', id: 'read', toolName: 'read', target: 'queue.ts', state: 'running', startedAt: 3, endedAt: null, sequence: 1 },
    ],
    [{ type: 'text', text: 'I found the issue.', state: 'streaming', startedAt: 4, sequence: 2 }],
  )

  expect(view.segments).toHaveLength(1)
  expect(view.segments[0]!.statusBefore?.label).toBe('Reading queue.ts')
  expect(view.liveStatus.label).toBe('Writing the response…')
})

test('preserves status and prose alternation across a response run', () => {
  const view = buildResponseRunView(
    [
      { kind: 'planning', id: 'plan', summary: 'Reviewing the event flow', startedAt: 1, endedAt: 1, sequence: 0 },
      { kind: 'thinking', id: 'thought', text: '', state: 'streaming', startedAt: 3, endedAt: 0, sequence: 2 },
    ],
    [
      { type: 'text', text: 'First update.', state: 'complete', startedAt: 2, sequence: 1 },
      { type: 'text', text: 'Second update.', state: 'streaming', startedAt: 4, sequence: 3 },
    ],
  )

  expect(view.segments.map((segment) => [segment.statusBefore?.label, segment.block.type === 'text' ? segment.block.text : ''])).toEqual([
    ['Reviewing the event flow', 'First update.'],
    ['Thinking through the next step…', 'Second update.'],
  ])
  expect(view.liveStatus.label).toBe('Writing the response…')
})

test('retains a past-tense, expandable thinking status for the final audit trail', () => {
  const view = buildResponseRunView(
    [{ kind: 'thinking', id: 'thought', text: 'Compare the event order.', state: 'complete', startedAt: 1, endedAt: 2, sequence: 0 }],
    [{ type: 'text', text: 'Done.', state: 'complete', startedAt: 3, sequence: 1 }],
  )

  const status = view.segments[0]!.statusBefore!
  expect(status.pastLabel).toBe('Thought through the next step')
  expect(status.source?.kind === 'thinking' && status.source.text).toBe('Compare the event order.')
})

test('keeps every tool call in the completed audit trail', () => {
  const view = buildResponseRunView(
    [
      { kind: 'tool-call', id: 'read', toolName: 'read', target: 'queue.ts', state: 'complete', startedAt: 1, endedAt: 2, sequence: 0 },
      { kind: 'tool-call', id: 'run', toolName: 'bash', target: 'bun test', state: 'complete', startedAt: 3, endedAt: 4, sequence: 1 },
    ],
    [{ type: 'text', text: 'Done.', state: 'complete', startedAt: 5, sequence: 2 }],
  )

  expect(view.auditEvents.filter((event) => event.type === 'status').map((event) => event.status.pastLabel)).toEqual([
    'Read queue.ts',
    'Ran command bun test',
  ])
})

test('does not create a disclosure trace for a plain text response', () => {
  const plain = buildResponseRunView([], [{ type: 'text', text: 'Hello', state: 'complete', startedAt: 1 }])
  expect(plain.auditEvents.filter((event) => event.type === 'status')).toHaveLength(0)
})
