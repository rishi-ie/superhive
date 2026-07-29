import { describe, expect, test } from 'bun:test'
import type { ProjectChannelMessage } from '../domain/entities'
import { selectAgentProjectMessages } from './selectors'

function message(
  id: string,
  actorId: string,
  recipientIds: string[],
  iterationId?: string,
): ProjectChannelMessage {
  return {
    schemaVersion: 2,
    id,
    role: 'project-channel',
    timestamp: 1,
    projectId: 'project',
    actor: { kind: 'worker', id: actorId, displayName: actorId },
    recipients: recipientIds.map((recipientId) => ({
      kind: 'worker',
      id: recipientId,
      displayName: recipientId,
    })),
    kind: 'conversation',
    text: id,
    iterationId,
  }
}

describe('selectAgentProjectMessages', () => {
  test('keeps worker routing and active-iteration lineage without leaking unrelated messages', () => {
    const result = selectAgentProjectMessages([
      message('handoff', 'coord', ['worker-1'], 'iteration-1'),
      message('progress', 'worker-1', ['coord'], 'iteration-1'),
      message('review', 'coord', [], 'iteration-1'),
      message('other', 'coord', ['worker-2'], 'iteration-2'),
    ], 'worker-1', 'iteration-1')

    expect(result.map((item) => item.id)).toEqual(['handoff', 'progress', 'review'])
  })
})
