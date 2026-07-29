import type { IdGenerator } from '../ports'

export class DeterministicIdGenerator implements IdGenerator {
  private nextId = 1
  next(): string { return `id-${this.nextId++}` }
}

