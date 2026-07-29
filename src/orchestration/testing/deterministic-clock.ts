import type { Clock } from '../ports'

export class DeterministicClock implements Clock {
  constructor(private value = 1_700_000_000_000) {}
  now(): number { return this.value++ }
}

