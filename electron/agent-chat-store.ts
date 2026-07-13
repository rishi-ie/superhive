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
	await ensureAgentDir(agentId)
	const path = chatPath(agentId)
	const lines = messages.map((m) => JSON.stringify(m)).join('\n') + '\n'
	await queueWrite(path, async () => {
		await fs.appendFile(path, lines, 'utf8')
	})
}

export async function readAll(agentId: string): Promise<RuntimeMessage[]> {
	const path = chatPath(agentId)
	try {
		const raw = await fs.readFile(path, 'utf8')
		const lines = raw.split('\n').filter((l) => l.trim())
		const messages: RuntimeMessage[] = []
		for (const line of lines) {
			try {
				const migrated = migratePersistedMessage(JSON.parse(line))
				if (migrated) messages.push(migrated)
			} catch {
				// Corrupt line — skip
			}
		}
		return messages
	} catch {
		return []
	}
}

export async function trimTo(agentId: string, maxMessages: number): Promise<void> {
	const messages = await readAll(agentId)
	if (messages.length <= maxMessages) return
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
