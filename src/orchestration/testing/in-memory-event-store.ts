import type { ProjectEventV1, UncommittedProjectEvent } from '../domain/events'
import type { Clock, DigestService, IdGenerator, ProjectEventStore } from '../ports'

export class InMemoryProjectEventStore implements ProjectEventStore {
  readonly events = new Map<string, ProjectEventV1[]>()

  constructor(
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly digests: DigestService,
  ) {}

  async append(projectId: string, pending: UncommittedProjectEvent[]): Promise<ProjectEventV1[]> {
    const existing = this.events.get(projectId) ?? []
    const committed: ProjectEventV1[] = []
    let previousDigest = existing.at(-1)?.digest
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
    this.events.set(projectId, [...existing, ...committed])
    return committed
  }

  async *read(projectId: string, afterSequence = 0): AsyncIterable<ProjectEventV1> {
    for (const event of this.events.get(projectId) ?? []) {
      if (event.sequence > afterSequence) yield event
    }
  }

  async getLastSequence(projectId: string): Promise<number> {
    return this.events.get(projectId)?.at(-1)?.sequence ?? 0
  }
}

