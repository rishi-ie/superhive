import { afterEach, describe, expect, test } from 'bun:test'
import { appendFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { DeterministicClock } from '../../src/orchestration/testing/deterministic-clock'
import { DeterministicIdGenerator } from '../../src/orchestration/testing/deterministic-id-generator'
import { FilesystemProjectEventStore } from './filesystem-event-store'
import { FilesystemOrchestrationLayout } from './filesystem-layout'
import { NodeDigestService } from './node-digest-service'

const roots: string[] = []

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'superhive-orchestration-'))
  roots.push(root)
  const layout = new FilesystemOrchestrationLayout({
    get: async (projectId) => ({ id: projectId, name: 'Test project', localPath: root }),
  })
  return {
    layout,
    store: new FilesystemProjectEventStore(
      layout,
      new DeterministicClock(),
      new DeterministicIdGenerator(),
      new NodeDigestService(),
    ),
  }
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe('FilesystemProjectEventStore', () => {
  test('serializes concurrent appends with unique sequences and a valid digest chain', async () => {
    const { store } = await fixture()
    const actor = { kind: 'system', id: 'system', displayName: 'System' } as const
    await Promise.all([
      store.append('project', [{ type: 'execution.started', actor, payload: {} }]),
      store.append('project', [{ type: 'execution.paused', actor, payload: {} }]),
    ])

    const events = []
    for await (const event of store.read('project')) events.push(event)
    expect(events.map((event) => event.sequence)).toEqual([1, 2])
    expect(events[1]?.previousDigest).toBe(events[0]?.digest)
    expect(await store.getLastSequence('project')).toBe(2)
  })

  test('refuses mutation replay when the append-only ledger is corrupt', async () => {
    const { layout, store } = await fixture()
    const actor = { kind: 'system', id: 'system', displayName: 'System' } as const
    await store.append('project', [{ type: 'execution.started', actor, payload: {} }])
    await appendFile(await layout.events('project'), JSON.stringify({
      schemaVersion: 1,
      id: 'tampered',
      sequence: 2,
      projectId: 'project',
      occurredAt: 1,
      actor,
      type: 'execution.paused',
      payload: {},
      previousDigest: 'wrong',
      digest: 'wrong',
    }) + '\n')

    let error: unknown
    try {
      for await (const _event of store.read('project')) {
        // Consume the stream so verification runs.
      }
    } catch (cause) {
      error = cause
    }
    expect(String(error)).toContain('digest chain is broken')
    await expect(store.append('project', [{
      type: 'execution.resumed',
      actor,
      payload: {},
    }])).rejects.toThrow('digest chain is broken')
  })
})
