import { promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'
import { queueWrite } from '../src/storage/queue-write'
import type { RuntimeMessage } from '../src/models/runtime'

export const AGENTS_CHAT_DIR = join(process.env.HOME ?? '', '.superhive', 'agents')

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
				messages.push(JSON.parse(line) as RuntimeMessage)
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
