/**
 * Tests for electron/mailbox-store.ts.
 *
 * Pure-FS roundtrip tests. Uses a tmp dir per test; no mocks needed.
 *
 * Run: `bun test electron/mailbox-store.test.ts`
 */

import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import {
	mkdirSync,
	rmSync,
	existsSync,
	readFileSync,
	writeFileSync,
} from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
	appendProjectChat,
	readProjectChat,
	markChatEntryDelivered,
	appendMemberInbox,
	readMemberInbox,
	ackInboxMessage,
	writeMailTelemetry,
	isWorkerChatEntry,
	type ChatEntry,
	type InboxEntry,
} from './mailbox-store'

let sandbox: string

function chatFile(dir: string): string {
	return join(dir, 'chat.jsonl')
}

function inboxFile(dir: string): string {
	return join(dir, 'inbox.jsonl')
}

beforeEach(() => {
	sandbox = join(tmpdir(), `mailbox-store-test-${crypto.randomUUID()}`)
	mkdirSync(sandbox, { recursive: true })
})

afterEach(() => {
	if (existsSync(sandbox)) {
		rmSync(sandbox, { recursive: true, force: true })
	}
})

function makeChatEntry(overrides: Partial<ChatEntry> = {}): ChatEntry {
	return {
		id: crypto.randomUUID(),
		ts: Date.now(),
		role: 'assistant',
		parts: [{ type: 'text', text: 'hello' }],
		...overrides,
	}
}

function makeInboxEntry(overrides: Partial<InboxEntry> = {}): InboxEntry {
	return {
		id: crypto.randomUUID(),
		ts: Date.now(),
		fromAgentId: 'agent-a',
		toAgentId: 'agent-b',
		kind: 'request',
		body: 'do thing',
		status: 'pending',
		...overrides,
	}
}

describe('appendProjectChat / readProjectChat', () => {
	test('roundtrips a single entry', () => {
		const entry = makeChatEntry({ fromAgentId: 'worker-1', kind: 'request' })
		appendProjectChat(sandbox, entry)
		const out = readProjectChat(sandbox)
		expect(out).toHaveLength(1)
		expect(out[0]?.id).toBe(entry.id)
		expect(out[0]?.fromAgentId).toBe('worker-1')
	})

	test('appends multiple entries in order', () => {
		const a = makeChatEntry({ ts: 1000 })
		const b = makeChatEntry({ ts: 2000 })
		const c = makeChatEntry({ ts: 3000 })
		appendProjectChat(sandbox, a)
		appendProjectChat(sandbox, b)
		appendProjectChat(sandbox, c)
		const out = readProjectChat(sandbox)
		expect(out.map((e) => e.ts)).toEqual([1000, 2000, 3000])
	})

	test('creates chat.jsonl if it does not exist', () => {
		expect(existsSync(chatFile(sandbox))).toBe(false)
		appendProjectChat(sandbox, makeChatEntry())
		expect(existsSync(chatFile(sandbox))).toBe(true)
	})

	test('readProjectChat on missing file returns empty array', () => {
		expect(readProjectChat(sandbox)).toEqual([])
	})
})

describe('readProjectChat filters', () => {
	const entries: ChatEntry[] = [
		makeChatEntry({ ts: 100, kind: 'request', fromAgentId: 'w1' }),
		makeChatEntry({ ts: 200, kind: 'result', fromAgentId: 'w1' }),
		makeChatEntry({ ts: 300, kind: 'broadcast', fromAgentId: 'w2' }),
		makeChatEntry({ ts: 400 }), // user message, no kind
	]

	beforeEach(() => {
		for (const e of entries) appendProjectChat(sandbox, e)
	})

	test('filters by kinds', () => {
		const out = readProjectChat(sandbox, { kinds: ['request', 'result'] })
		expect(out.map((e) => e.ts)).toEqual([100, 200])
	})

	test('excludes specific fromAgentIds', () => {
		const out = readProjectChat(sandbox, { excludeFromAgentIds: ['w1'] })
		expect(out.map((e) => e.ts)).toEqual([300, 400])
	})

	test('excludes null (user messages)', () => {
		const out = readProjectChat(sandbox, { excludeFromAgentIds: [null] })
		expect(out.map((e) => e.ts)).toEqual([100, 200, 300])
	})

	test('limits to most recent N', () => {
		const out = readProjectChat(sandbox, { limit: 2 })
		expect(out.map((e) => e.ts)).toEqual([300, 400])
	})

	test('filters by sinceTs', () => {
		const out = readProjectChat(sandbox, { sinceTs: 250 })
		expect(out.map((e) => e.ts)).toEqual([300, 400])
	})
})

describe('markChatEntryDelivered', () => {
	test('adds agentId to deliveredTo[]', async () => {
		const e = makeChatEntry({ id: 'msg-1', fromAgentId: 'w1', kind: 'request' })
		appendProjectChat(sandbox, e)
		const ok = await markChatEntryDelivered(sandbox, 'msg-1', 'coord-1')
		expect(ok).toBe(true)
		const out = readProjectChat(sandbox)
		expect(out[0]?.deliveredTo).toEqual(['coord-1'])
	})

	test('does not duplicate if agentId already in deliveredTo', async () => {
		const e = makeChatEntry({
			id: 'msg-1',
			fromAgentId: 'w1',
			kind: 'request',
			deliveredTo: ['coord-1'],
		})
		appendProjectChat(sandbox, e)
		const ok = await markChatEntryDelivered(sandbox, 'msg-1', 'coord-1')
		expect(ok).toBe(false) // no mutation
		const out = readProjectChat(sandbox)
		expect(out[0]?.deliveredTo).toEqual(['coord-1'])
	})

	test('adds multiple agentIds independently', async () => {
		const e = makeChatEntry({ id: 'msg-1', fromAgentId: 'w1', kind: 'request' })
		appendProjectChat(sandbox, e)
		await markChatEntryDelivered(sandbox, 'msg-1', 'coord-1')
		await markChatEntryDelivered(sandbox, 'msg-1', 'w2')
		const out = readProjectChat(sandbox)
		expect(out[0]?.deliveredTo).toEqual(['coord-1', 'w2'])
	})

	test('returns false if messageId not found', async () => {
		appendProjectChat(sandbox, makeChatEntry({ id: 'msg-1' }))
		const ok = await markChatEntryDelivered(sandbox, 'no-such', 'coord-1')
		expect(ok).toBe(false)
	})

	test('preserves other entries when rewriting', async () => {
		appendProjectChat(sandbox, makeChatEntry({ id: 'msg-a', fromAgentId: 'w1' }))
		appendProjectChat(sandbox, makeChatEntry({ id: 'msg-b', fromAgentId: 'w2' }))
		await markChatEntryDelivered(sandbox, 'msg-a', 'coord-1')
		const out = readProjectChat(sandbox)
		expect(out).toHaveLength(2)
		expect(out.find((e) => e.id === 'msg-a')?.deliveredTo).toEqual(['coord-1'])
		expect(out.find((e) => e.id === 'msg-b')?.deliveredTo).toBeUndefined()
	})
})

describe('appendMemberInbox / readMemberInbox', () => {
	test('roundtrips a single entry', () => {
		const e = makeInboxEntry({ fromAgentId: 'coord-1' })
		appendMemberInbox(sandbox, e)
		const out = readMemberInbox(sandbox)
		expect(out).toHaveLength(1)
		expect(out[0]?.id).toBe(e.id)
	})

	test('creates inbox.jsonl if it does not exist', () => {
		expect(existsSync(inboxFile(sandbox))).toBe(false)
		appendMemberInbox(sandbox, makeInboxEntry())
		expect(existsSync(inboxFile(sandbox))).toBe(true)
	})

	test('readMemberInbox on missing file returns empty array', () => {
		expect(readMemberInbox(sandbox)).toEqual([])
	})

	test('filters by status', () => {
		appendMemberInbox(sandbox, makeInboxEntry({ id: 'a', status: 'pending' }))
		appendMemberInbox(sandbox, makeInboxEntry({ id: 'b', status: 'delivered' }))
		appendMemberInbox(sandbox, makeInboxEntry({ id: 'c', status: 'acked' }))
		const pending = readMemberInbox(sandbox, { status: ['pending'] })
		expect(pending.map((e) => e.id)).toEqual(['a'])
		const unacked = readMemberInbox(sandbox, { status: ['pending', 'delivered'] })
		expect(unacked.map((e) => e.id).sort()).toEqual(['a', 'b'])
	})

	test('limits to most recent N (last 2 by file order)', () => {
		for (let i = 0; i < 5; i++) {
			appendMemberInbox(sandbox, makeInboxEntry({ ts: 1000 + i }))
		}
		const out = readMemberInbox(sandbox, { limit: 2 })
		// File order: 1000, 1001, 1002, 1003, 1004 — last 2 by position.
		expect(out.map((e) => e.ts)).toEqual([1003, 1004])
	})
})

describe('ackInboxMessage', () => {
	test('flips pending → acked and stamps ackedAt', async () => {
		const e = makeInboxEntry({ id: 'msg-1', status: 'pending' })
		appendMemberInbox(sandbox, e)
		const ok = await ackInboxMessage(sandbox, 'msg-1')
		expect(ok).toBe(true)
		const out = readMemberInbox(sandbox)
		expect(out[0]?.status).toBe('acked')
		expect(out[0]?.ackedAt).toBeGreaterThan(0)
	})

	test('no-ops if already acked', async () => {
		appendMemberInbox(
			sandbox,
			makeInboxEntry({ id: 'msg-1', status: 'acked', ackedAt: 5000 }),
		)
		const ok = await ackInboxMessage(sandbox, 'msg-1')
		expect(ok).toBe(false)
		const out = readMemberInbox(sandbox)
		expect(out[0]?.ackedAt).toBe(5000) // unchanged
	})

	test('preserves other entries when rewriting', async () => {
		appendMemberInbox(sandbox, makeInboxEntry({ id: 'a' }))
		appendMemberInbox(sandbox, makeInboxEntry({ id: 'b' }))
		await ackInboxMessage(sandbox, 'a')
		const out = readMemberInbox(sandbox)
		expect(out).toHaveLength(2)
		expect(out.find((e) => e.id === 'a')?.status).toBe('acked')
		expect(out.find((e) => e.id === 'b')?.status).toBe('pending')
	})
})

describe('writeMailTelemetry', () => {
	test('appends a single JSON line to telemetry.jsonl', () => {
		writeMailTelemetry(sandbox, {
			ts: Date.now(),
			type: 'mail',
			direction: 'sent',
			messageId: 'm-1',
			fromAgentId: 'w1',
			toAgentId: 'w2',
			kind: 'request',
		})
		const path = join(sandbox, 'telemetry.jsonl')
		expect(existsSync(path)).toBe(true)
		const raw = readFileSync(path, 'utf8').trim()
		expect(raw).toMatch(/^\{.*\}$/)
		const parsed = JSON.parse(raw)
		expect(parsed.type).toBe('mail')
		expect(parsed.direction).toBe('sent')
	})

	test('appends multiple events (one per line)', () => {
		writeMailTelemetry(sandbox, {
			ts: 1, type: 'mail', direction: 'sent', messageId: 'a',
			fromAgentId: 'w1', toAgentId: 'w2', kind: 'request',
		})
		writeMailTelemetry(sandbox, {
			ts: 2, type: 'mail', direction: 'received', messageId: 'a',
			fromAgentId: 'w1', toAgentId: 'w2', kind: 'request',
		})
		const raw = readFileSync(join(sandbox, 'telemetry.jsonl'), 'utf8')
		const lines = raw.split('\n').filter(Boolean)
		expect(lines).toHaveLength(2)
		expect(JSON.parse(lines[0]!).direction).toBe('sent')
		expect(JSON.parse(lines[1]!).direction).toBe('received')
	})
})

describe('isWorkerChatEntry', () => {
	test('user message (no fromAgentId) → false', () => {
		const e = makeChatEntry()
		expect(isWorkerChatEntry(e, 'coord-1')).toBe(false)
	})

	test('coordinator own message → false', () => {
		const e = makeChatEntry({ fromAgentId: 'coord-1' })
		expect(isWorkerChatEntry(e, 'coord-1')).toBe(false)
	})

	test('worker message → true', () => {
		const e = makeChatEntry({ fromAgentId: 'worker-1' })
		expect(isWorkerChatEntry(e, 'coord-1')).toBe(true)
	})
})

describe('malformed-line resilience', () => {
	test('readProjectChat skips malformed lines', () => {
		appendProjectChat(sandbox, makeChatEntry({ id: 'good-1' }))
		// Inject a malformed line.
		const path = chatFile(sandbox)
		const existing = readFileSync(path, 'utf8')
		writeFileSync(path, existing + 'not json\n' + JSON.stringify({ id: 'good-2', ts: 2, role: 'assistant', parts: [{type:'text',text:'x'}] }) + '\n')
		const out = readProjectChat(sandbox)
		expect(out).toHaveLength(2)
		expect(out.map((e) => e.id)).toEqual(['good-1', 'good-2'])
	})

	test('readMemberInbox skips malformed lines', () => {
		appendMemberInbox(sandbox, makeInboxEntry({ id: 'good-1' }))
		const path = inboxFile(sandbox)
		const existing = readFileSync(path, 'utf8')
		writeFileSync(path, existing + '{broken\n')
		const out = readMemberInbox(sandbox)
		expect(out).toHaveLength(1)
		expect(out[0]?.id).toBe('good-1')
	})
})
