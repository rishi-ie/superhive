import type { ProjectEventV1, UncommittedProjectEvent } from '../domain/events'

export interface ProjectEventStore {
  append(projectId: string, events: UncommittedProjectEvent[]): Promise<ProjectEventV1[]>
  read(projectId: string, afterSequence?: number): AsyncIterable<ProjectEventV1>
  getLastSequence(projectId: string): Promise<number>
}

