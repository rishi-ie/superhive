import type { WorkerProfileDefinition } from '../domain/entities'

export interface WorkerProfileRegistry {
  get(profileId: string): WorkerProfileDefinition | null
  list(): readonly WorkerProfileDefinition[]
}

export class InMemoryWorkerProfileRegistry implements WorkerProfileRegistry {
  private readonly profiles = new Map<string, WorkerProfileDefinition>()

  register(profile: WorkerProfileDefinition): void {
    if (this.profiles.has(profile.id)) {
      throw new Error(`Worker profile ${profile.id} is already registered`)
    }
    this.profiles.set(profile.id, structuredClone(profile))
  }

  get(profileId: string): WorkerProfileDefinition | null {
    return this.profiles.get(profileId) ?? null
  }

  list(): readonly WorkerProfileDefinition[] {
    return [...this.profiles.values()]
  }
}

