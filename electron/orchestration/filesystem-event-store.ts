import { mkdir, readFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { queueWrite } from '../../src/storage/queue-write'
import type { ProjectEventV1, UncommittedProjectEvent } from '../../src/orchestration/domain/events'
import type {
  Clock,
  DigestService,
  IdGenerator,
  ProjectEventStore,
} from '../../src/orchestration/ports'
import { FilesystemOrchestrationLayout } from './filesystem-layout'

export class FilesystemProjectEventStore implements ProjectEventStore {
  constructor(
    private readonly layout: FilesystemOrchestrationLayout,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly digests: DigestService,
  ) {}

  async append(projectId: string, pending: UncommittedProjectEvent[]): Promise<ProjectEventV1[]> {
    if (pending.length === 0) return []
    const path = await this.layout.events(projectId)
    let committed: ProjectEventV1[] = []
    await mkdir(dirname(path), { recursive: true })
    await queueWrite(path, async () => {
      const existing = await readEvents(path)
      await this.verify(existing)
      let previousDigest = existing.at(-1)?.digest
      committed = []
      for (const event of pending) {
        const unsigned = {
          ...event,
          schemaVersion: 1 as const,
          id: this.ids.next(),
          sequence: existing.length + committed.length + 1,
          projectId,
          occurredAt: this.clock.now(),
          previousDigest,
        }
        const row: ProjectEventV1 = { ...unsigned, digest: await this.digests.digest(unsigned) }
        committed.push(row)
        previousDigest = row.digest
      }
      const { appendFile } = await import('node:fs/promises')
      await appendFile(path, committed.map((event) => JSON.stringify(event)).join('\n') + '\n', 'utf8')
    })
    return committed
  }

  async *read(projectId: string, afterSequence = 0): AsyncIterable<ProjectEventV1> {
    const events = await readEvents(await this.layout.events(projectId))
    await this.verify(events)
    for (const event of events) {
      if (event.sequence > afterSequence) yield event
    }
  }

  private async verify(events: ProjectEventV1[]): Promise<void> {
    let previousDigest: string | undefined
    for (const event of events) {
      if (event.sequence > 1 && event.previousDigest !== previousDigest) {
        throw new Error(`Project event digest chain is broken at sequence ${event.sequence}`)
      }
      const { digest, ...unsigned } = event
      if (await this.digests.digest(unsigned) !== digest) {
        throw new Error(`Project event digest mismatch at sequence ${event.sequence}`)
      }
      previousDigest = digest
    }
  }

  async getLastSequence(projectId: string): Promise<number> {
    return (await readEvents(await this.layout.events(projectId))).at(-1)?.sequence ?? 0
  }
}

async function readEvents(path: string): Promise<ProjectEventV1[]> {
  try {
    const raw = await readFile(path, 'utf8')
    return raw.split('\n').filter(Boolean).map((line) => JSON.parse(line) as ProjectEventV1)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
}
