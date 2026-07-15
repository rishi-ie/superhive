import { promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'
import { queueWrite } from '../src/storage/queue-write'
import type { ContentPart, RuntimeMessage } from '../src/models/runtime'

export const AGENTS_CHAT_DIR = join(process.env.HOME ?? '', '.superhive', 'agents')

/**
 * Migration shim: chat rows persisted before Phase 1.4.3 (when the schema
 * changed from `content: string` to `parts: ContentPart[]`) only have a
 * `content` field. Bring them up to the new shape without losing data.
 *
 * The renderer treats `content` as deprecated — it still exists on user
 * messages built in code paths that haven't been migrated, but everything
 * coming through the runtime writes through `parts` instead.
 *
 * Self-heal: any part persisted with a non-'complete' state (e.g. 'streaming'
 * from a flush that raced message-end, or 'pending' from a tool-call-start
 * flush that raced tool-call-end) is treated as 'complete'. A message only
 * reaches chat.jsonl when the runtime decides to flush it, so a
 * streaming/pending state on disk is always a stale partial write.
 */
export function migratePersistedMessage(raw: unknown): RuntimeMessage | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  const id = typeof obj.id === 'string' ? obj.id : null
  if (!id) return null
  const role: 'user' | 'assistant' = obj.role === 'assistant' ? 'assistant' : 'user'
  const ts = typeof obj.ts === 'number' ? obj.ts : Date.now()

  let parts: ContentPart[]
  if (Array.isArray(obj.parts)) {
    parts = obj.parts as ContentPart[]
  } else if (typeof obj.content === 'string') {
    parts = [{ type: 'text', text: obj.content, state: 'complete' }]
  } else {
    parts = []
  }

  // Self-heal: normalize any non-complete part state to 'complete'.
  // chat.jsonl is the source of truth for completed turns; any streaming or
  // pending state on disk is a race artifact and must not survive a reload.
  parts = parts.map((p) => {
    switch (p.type) {
      case 'text':
      case 'thinking':
        if (p.state !== 'complete') return { ...p, state: 'complete' as const }
        return p
      case 'tool-call':
        if (p.state !== 'complete') return { ...p, state: 'complete' as const }
        return p
      case 'tool-result':
        if (p.state !== 'complete') return { ...p, state: 'complete' as const }
        return p
      default:
        return p
    }
  })

  const out: RuntimeMessage = { id, role, parts, ts }
  if (obj.usage && typeof obj.usage === 'object') {
    out.usage = obj.usage as RuntimeMessage['usage']
  }
  return out
}

function chatPath(agentId: string): string {
	return join(AGENTS_CHAT_DIR, agentId, 'chat.jsonl')
}

async function ensureAgentDir(agentId: string): Promise<void> {
	await fs.mkdir(dirname(chatPath(agentId)), { recursive: true })
}

export async function append(agentId: string, message: RuntimeMessage): Promise<void> {
	await ensureAgentDir(agentId)
	const path = chatPath(agentId)
	await queueWrite(path, async () => {
		await fs.appendFile(path, JSON.stringify(message) + '\n', 'utf8')
	})
}

export async function appendBatch(agentId: string, messages: RuntimeMessage[]): Promise<void> {
	if (messages.length === 0) return
	const normalized = messages.map((m) => migratePersistedMessage(m) ?? m)
	await ensureAgentDir(agentId)
	const path = chatPath(agentId)
	// Merge with existing file: replace any entry with the same id, append new.
	// Without this, message-end re-flushing the same message (after the fix that
	// re-arms persist on message-end) would append a duplicate line for that
	// id, causing the same message to appear twice in chat.jsonl.
	await queueWrite(path, async () => {
		const existing: RuntimeMessage[] = []
		try {
			const raw = await fs.readFile(path, 'utf8')
			for (const line of raw.split('\n')) {
				if (!line.trim()) continue
				try {
					const m = migratePersistedMessage(JSON.parse(line))
					if (m) existing.push(m)
				} catch {
					// Corrupt line — skip
				}
			}
		} catch {
			// File doesn't exist yet
		}
		const byId = new Map<string, RuntimeMessage>()
		for (const m of existing) byId.set(m.id, m)
		for (const m of normalized) byId.set(m.id, m)
		const merged = Array.from(byId.values())
		const body =
			merged.length === 0 ? '' : merged.map((m) => JSON.stringify(m)).join('\n') + '\n'
		await fs.writeFile(path, body, 'utf8')
	})
}

export async function readAll(agentId: string): Promise<RuntimeMessage[]> {
	const path = chatPath(agentId)
	try {
		const raw = await fs.readFile(path, 'utf8')
		const lines = raw.split('\n').filter((l) => l.trim())
		// Dedupe by id: if the same message id appears multiple times (from a
		// race where the same message was flushed and re-flushed before this fix,
		// or from concurrent writes), keep only the last entry. Last write wins.
		const byId = new Map<string, RuntimeMessage>()
		for (const line of lines) {
			try {
				const migrated = migratePersistedMessage(JSON.parse(line))
				if (migrated) byId.set(migrated.id, migrated)
			} catch {
				// Corrupt line — skip
			}
		}
		return Array.from(byId.values())
	} catch {
		return []
	}
}

export async function trimTo(agentId: string, maxMessages: number): Promise<void> {
	const messages = await readAll(agentId)
	if (messages.length <= maxMessages) return
	// Keep the newest maxMessages entries (last N by timestamp order in file).
	const toKeep = messages.slice(-maxMessages)
	const path = chatPath(agentId)
	await queueWrite(path, async () => {
		await fs.writeFile(path, toKeep.map((m) => JSON.stringify(m)).join('\n') + '\n', 'utf8')
	})
}

export async function clear(agentId: string): Promise<void> {
	const path = chatPath(agentId)
	try {
		await queueWrite(path, async () => {
			await fs.writeFile(path, '', 'utf8')
		})
	} catch {
		// Already gone
	}
}

/**
 * Atomically rewrite the chat file to `messages`. Used by Phase 10.2/10.3/10.4
 * (edit/regenerate/delete) where the on-disk ordering must drop or replace
 * rows, not just append. Concurrency: goes through `queueWrite` so it serializes
 * against concurrent `appendBatch` calls.
 */
export async function replaceAll(agentId: string, messages: RuntimeMessage[]): Promise<void> {
	await ensureAgentDir(agentId)
	const path = chatPath(agentId)
	const normalized = messages.map((m) => migratePersistedMessage(m) ?? m)
	const body = normalized.length === 0 ? '' : normalized.map((m) => JSON.stringify(m)).join('\n') + '\n'
	await queueWrite(path, async () => {
		await fs.writeFile(path, body, 'utf8')
	})
}
