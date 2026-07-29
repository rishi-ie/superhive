import { createHash } from 'node:crypto'
import type { DigestService } from '../../src/orchestration/ports'

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, canonical(item)]),
  )
}

export class NodeDigestService implements DigestService {
  async digest(value: unknown): Promise<string> {
    return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex')
  }
}

