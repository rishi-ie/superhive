/**
 * Pure-FS helpers for the Gap 2 mailbox.
 *
 * Two files power agent-to-project communication:
 *
 *   - <coordDir>/chat.jsonl — the project chat. Every agent (and the user)
 *     appends here. Tagged with `fromAgentId, fromAgentName, kind`. The
 *     coordinator LLM sees worker posts by calling `read_inbox` (which
 *     filters by `kind` and excludes its own messages).
 *
 *   - <memberDir>/inbox.jsonl — per-member direct-ask inbox. Only the
 *     coordinator writes here. The member reads when its runtime injects
 *     a `[mail] New ask in your inbox` wake prompt.
 *
 * Plus:
 *
 *   - <agentDir>/telemetry.jsonl — MailEvent appends. Main process writes
 *     here whenever it observes a mailbox change. The extension does NOT
 *     write telemetry (no cross-module import).
 *
 * All write paths use the existing tmp + rename pattern from
 * `electron/agent-chat-store.ts` for full-file rewrites (`ackMessage`,
 * `markDelivered`) and `appendFileSync` for append-only paths. Append is
 * atomic for single-line writes on POSIX (writes < `PIPE_BUF` = 4096 bytes
 * are guaranteed atomic). For longer lines (rare), the tailer can see a
 * partial entry and skip it via the malformed-line guard.
 */

import {
	appendFileSync,
	existsSync,
	mkdirSync,
	readFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { writeFile, rename } from 'node:fs/promises'
import log from 'electron-log/main'
import type { MailEvent } from '../../superhive-pi-telemetry/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MailKind = 'request' | 'result' | 'question' | 'broadcast'
export type InboxStatus = 'pending' | 'delivered' | 'acked'

/** Single line in <coordDir>/chat.jsonl. */
export interface ChatEntry {
	id: string
	ts: number
	role: 'user' | 'assistant'
	parts: Array<{ type: 'text'; text: string }>
	// Gap 2 — populated when the entry came from an agent, not the user.
	fromAgentId?: string
	fromAgentName?: string
	kind?: MailKind
	refMessageId?: string
	deliveredTo?: string[]
}

/** Single line in <memberDir>/inbox.jsonl. */
export interface InboxEntry {
	id: string
	ts: number
	fromAgentId: string
	toAgentId: string
	kind: Exclude<MailKind, 'broadcast'>
	body: string
	refMessageId?: string
	status: InboxStatus
	deliveredAt?: number
	ackedAt?: number
}

export interface ReadProjectChatOpts {
	limit?: number
	sinceTs?: number
	kinds?: MailKind[]
	excludeFromAgentIds?: Array<string | null>
}

export interface ReadMemberInboxOpts {
	limit?: number
	status?: InboxStatus[]
	kinds?: InboxEntry['kind'][]
}

// ---------------------------------------------------------------------------
// Atomic write helpers
// ---------------------------------------------------------------------------

function ensureDir(filePath: string): void {
	const dir = dirname(filePath)
	if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

async function atomicRewrite(filePath: string, content: string): Promise<void> {
	ensureDir(filePath)
	const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`
	await writeFile(tmp, content, 'utf8')
	await rename(tmp, filePath)
}

// ---------------------------------------------------------------------------
// Project chat (<coordDir>/chat.jsonl)
// ---------------------------------------------------------------------------

function chatFilePath(coordDir: string): string {
	return join(coordDir, 'chat.jsonl')
}

function serializeChatEntry(entry: ChatEntry): string {
	return JSON.stringify(entry) + '\n'
}

export function appendProjectChat(coordDir: string, entry: ChatEntry): void {
	const path = chatFilePath(coordDir)
	ensureDir(path)
	appendFileSync(path, serializeChatEntry(entry), 'utf8')
}

export function readProjectChat(
	coordDir: string,
	opts: ReadProjectChatOpts = {},
): ChatEntry[] {
	const path = chatFilePath(coordDir)
	if (!existsSync(path)) return []
	const raw = readFileSync(path, 'utf8')
	const lines = raw.split('\n')
	const entries: ChatEntry[] = []
	for (const line of lines) {
		if (!line) continue
		try {
			const parsed = JSON.parse(line) as ChatEntry
			entries.push(parsed)
		} catch (err) {
			log.warn(`[mailbox-store] skipping malformed chat line in ${path}: ${err instanceof Error ? err.message : String(err)}`)
		}
	}

	let filtered = entries
	if (opts.sinceTs !== undefined) {
		filtered = filtered.filter((e) => e.ts >= (opts.sinceTs ?? 0))
	}
	if (opts.kinds && opts.kinds.length > 0) {
		const allowed = new Set(opts.kinds)
		filtered = filtered.filter((e) => e.kind && allowed.has(e.kind))
	}
	if (opts.excludeFromAgentIds && opts.excludeFromAgentIds.length > 0) {
		const excluded = new Set<string | null>(opts.excludeFromAgentIds)
		filtered = filtered.filter((e) => {
			// Treat undefined fromAgentId as null (user messages) so callers
			// can pass `null` in the exclude list to drop user entries.
			const fromId = e.fromAgentId ?? null
			return !excluded.has(fromId)
		})
	}
	if (opts.limit !== undefined && opts.limit > 0) {
		// Return the most recent N (slice tail, not head).
		filtered = filtered.slice(-opts.limit)
	}
	return filtered
}

export async function markChatEntryDelivered(
	coordDir: string,
	messageId: string,
	agentId: string,
): Promise<boolean> {
	const path = chatFilePath(coordDir)
	if (!existsSync(path)) return false
	const raw = readFileSync(path, 'utf8')
	const lines = raw.split('\n')
	let mutated = false
	const out: string[] = []
	for (const line of lines) {
		if (!line) {
			out.push(line)
			continue
		}
		try {
			const parsed = JSON.parse(line) as ChatEntry
			if (parsed.id === messageId) {
				const delivered = parsed.deliveredTo ?? []
				if (!delivered.includes(agentId)) {
					parsed.deliveredTo = [...delivered, agentId]
					mutated = true
				}
			}
			out.push(JSON.stringify(parsed))
		} catch {
			// Preserve malformed lines verbatim.
			out.push(line)
		}
	}
	if (!mutated) return false
	await atomicRewrite(path, out.join('\n') + (out[out.length - 1] ? '\n' : ''))
	return true
}

// ---------------------------------------------------------------------------
// Member inbox (<memberDir>/inbox.jsonl)
// ---------------------------------------------------------------------------

function inboxFilePath(memberDir: string): string {
	return join(memberDir, 'inbox.jsonl')
}

function serializeInboxEntry(entry: InboxEntry): string {
	return JSON.stringify(entry) + '\n'
}

export function appendMemberInbox(memberDir: string, entry: InboxEntry): void {
	const path = inboxFilePath(memberDir)
	ensureDir(path)
	appendFileSync(path, serializeInboxEntry(entry), 'utf8')
}

export function readMemberInbox(
	memberDir: string,
	opts: ReadMemberInboxOpts = {},
): InboxEntry[] {
	const path = inboxFilePath(memberDir)
	if (!existsSync(path)) return []
	const raw = readFileSync(path, 'utf8')
	const lines = raw.split('\n')
	const entries: InboxEntry[] = []
	for (const line of lines) {
		if (!line) continue
		try {
			const parsed = JSON.parse(line) as InboxEntry
			entries.push(parsed)
		} catch (err) {
			log.warn(`[mailbox-store] skipping malformed inbox line in ${path}: ${err instanceof Error ? err.message : String(err)}`)
		}
	}

	let filtered = entries
	if (opts.status && opts.status.length > 0) {
		const allowed = new Set(opts.status)
		filtered = filtered.filter((e) => allowed.has(e.status))
	}
	if (opts.kinds && opts.kinds.length > 0) {
		const allowed = new Set(opts.kinds)
		filtered = filtered.filter((e) => allowed.has(e.kind))
	}
	if (opts.limit !== undefined && opts.limit > 0) {
		filtered = filtered.slice(-opts.limit)
	}
	return filtered
}

export async function ackInboxMessage(
	memberDir: string,
	messageId: string,
): Promise<boolean> {
	const path = inboxFilePath(memberDir)
	if (!existsSync(path)) return false
	const raw = readFileSync(path, 'utf8')
	const lines = raw.split('\n')
	let mutated = false
	const out: string[] = []
	for (const line of lines) {
		if (!line) {
			out.push(line)
			continue
		}
		try {
			const parsed = JSON.parse(line) as InboxEntry
			if (parsed.id === messageId && parsed.status !== 'acked') {
				parsed.status = 'acked'
				parsed.ackedAt = Date.now()
				mutated = true
			}
			out.push(JSON.stringify(parsed))
		} catch {
			out.push(line)
		}
	}
	if (!mutated) return false
	await atomicRewrite(path, out.join('\n') + (out[out.length - 1] ? '\n' : ''))
	return true
}

// ---------------------------------------------------------------------------
// Telemetry (MailEvent → <agentDir>/telemetry.jsonl)
// ---------------------------------------------------------------------------

/**
 * Append a single MailEvent line to the agent's telemetry journal. The
 * canonical writer is `appendEvent` in `superhive-pi-telemetry/journal.ts`
 * but the main process can't easily import that file (no built dist
 * target). We re-implement the single-line append here with the same
 * on-disk format: `{ts, type, ...}\n`.
 *
 * Mirrors the wire format produced by the extension's journal writer.
 */
export function writeMailTelemetry(agentDir: string, event: MailEvent): void {
	const path = join(agentDir, 'telemetry.jsonl')
	ensureDir(path)
	appendFileSync(path, JSON.stringify(event) + '\n', 'utf8')
}

// ---------------------------------------------------------------------------
// Convenience: detect whether a chat entry is from a worker (vs user / coord)
// ---------------------------------------------------------------------------

export function isWorkerChatEntry(
	entry: ChatEntry,
	coordinatorId: string | null,
): boolean {
	if (!entry.fromAgentId) return false // user message
	if (entry.fromAgentId === coordinatorId) return false // coordinator's own
	return true
}
