/**
 * Tests for electron/mailbox-watcher.ts.
 *
 * Verifies the tailer's two notification paths:
 *  - onCoordMail fires for new chat entries from a non-user, non-coord
 *  - onMemberMail fires for new inbox entries (any fromAgentId)
 *
 * Uses real fs + real timers (no mocks) since the watcher is a thin
 * wrapper over fs.watch + setTimeout. Debounce is 250ms; tests wait
 * 400ms after the file mutation to let the notification fire.
 *
 * Run: `bun test electron/mailbox-watcher.test.ts`
 */

import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import { mkdirSync, rmSync, existsSync, appendFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { mailboxWatcher } from './mailbox-watcher'
import { appendProjectChat, appendMemberInbox, type ChatEntry, type InboxEntry } from './mailbox-store'

let sandbox: string
let projectDir: string
let projectAgentDir: string
let memberDir: string

const MEMBER_ID = 'member-uuid-1'
const COORD_ID = 'coord-uuid-1'

beforeEach(async () => {
	mailboxWatcher.stop()
	sandbox = join(tmpdir(), `mailbox-watcher-test-${crypto.randomUUID()}`)
	projectDir = join(sandbox, 'project-x')
	projectAgentDir = join(projectDir, 'agent')
	memberDir = join(sandbox, 'agent-m')
	mkdirSync(projectAgentDir, { recursive: true })
	mkdirSync(memberDir, { recursive: true })
	mailboxWatcher.start()
})

afterEach(() => {
	mailboxWatcher.stop()
	if (existsSync(sandbox)) {
		rmSync(sandbox, { recursive: true, force: true })
	}
})

function sleep(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms))
}

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
		fromAgentId: COORD_ID,
		toAgentId: MEMBER_ID,
		kind: 'request',
		body: 'do thing',
		status: 'pending',
		...overrides,
	}
}

describe('MailboxWatcher — member inbox', () => {
	test('fires onMemberMail when inbox.jsonl is appended to', async () => {
		const calls: Array<{ memberId: string; entry: InboxEntry }> = []
		mailboxWatcher.onMemberMail = (memberId, entry) => {
			calls.push({ memberId, entry })
		}

		mailboxWatcher.watchAgent({
			agentId: MEMBER_ID,
			agentDir: memberDir,
		})

		const entry = makeInboxEntry()
		appendMemberInbox(memberDir, entry)

		await sleep(500) // > debounce 250ms

		expect(calls).toHaveLength(1)
		expect(calls[0]?.memberId).toBe(MEMBER_ID)
		expect(calls[0]?.entry.id).toBe(entry.id)
	})

	test('fires once per appended entry (burst)', async () => {
		const calls: Array<{ memberId: string; entry: InboxEntry }> = []
		mailboxWatcher.onMemberMail = (memberId, entry) => {
			calls.push({ memberId, entry })
		}

		mailboxWatcher.watchAgent({
			agentId: MEMBER_ID,
			agentDir: memberDir,
		})

		const a = makeInboxEntry()
		const b = makeInboxEntry()
		const c = makeInboxEntry()
		appendMemberInbox(memberDir, a)
		appendMemberInbox(memberDir, b)
		appendMemberInbox(memberDir, c)

		await sleep(500)

		expect(calls.map((c) => c.entry.id)).toEqual([a.id, b.id, c.id])
	})

	test('does not fire after unwatchAgent', async () => {
		const calls: Array<{ memberId: string; entry: InboxEntry }> = []
		mailboxWatcher.onMemberMail = (memberId, entry) => {
			calls.push({ memberId, entry })
		}

		mailboxWatcher.watchAgent({
			agentId: MEMBER_ID,
			agentDir: memberDir,
		})

		mailboxWatcher.unwatchAgent(MEMBER_ID)

		appendMemberInbox(memberDir, makeInboxEntry())
		await sleep(500)

		expect(calls).toHaveLength(0)
	})

	test('multiple members are independent', async () => {
		const calls = new Map<string, InboxEntry[]>()
		mailboxWatcher.onMemberMail = (memberId, entry) => {
			if (!calls.has(memberId)) calls.set(memberId, [])
			calls.get(memberId)!.push(entry)
		}

		const memberDir2 = join(sandbox, 'agent-m2')
		mkdirSync(memberDir2)

		mailboxWatcher.watchAgent({ agentId: 'm1', agentDir: memberDir })
		mailboxWatcher.watchAgent({ agentId: 'm2', agentDir: memberDir2 })

		const e1 = makeInboxEntry({ toAgentId: 'm1' })
		const e2 = makeInboxEntry({ toAgentId: 'm2' })
		appendMemberInbox(memberDir, e1)
		appendMemberInbox(memberDir2, e2)

		await sleep(500)

		expect(calls.get('m1')?.map((e) => e.id)).toEqual([e1.id])
		expect(calls.get('m2')?.map((e) => e.id)).toEqual([e2.id])
	})
})

describe('MailboxWatcher — project chat', () => {
	test('fires onCoordMail for worker post in project chat', async () => {
		const calls: ChatEntry[] = []
		mailboxWatcher.onCoordMail = (entry) => {
			calls.push(entry)
		}

		mailboxWatcher.watchAgent({
			agentId: COORD_ID,
			agentDir: projectAgentDir,
			projectDir,
			coordinatorId: COORD_ID,
		})

		const entry = makeChatEntry({ fromAgentId: 'worker-1', kind: 'request' })
		appendProjectChat(projectAgentDir, entry)

		await sleep(500)

		expect(calls).toHaveLength(1)
		expect(calls[0]?.fromAgentId).toBe('worker-1')
		expect(calls[0]?.id).toBe(entry.id)
	})

	test('does NOT fire for user messages (no fromAgentId)', async () => {
		const calls: ChatEntry[] = []
		mailboxWatcher.onCoordMail = (entry) => {
			calls.push(entry)
		}

		mailboxWatcher.watchAgent({
			agentId: COORD_ID,
			agentDir: projectAgentDir,
			projectDir,
			coordinatorId: COORD_ID,
		})

		// User message — no fromAgentId.
		appendProjectChat(projectAgentDir, makeChatEntry())

		await sleep(500)

		expect(calls).toHaveLength(0)
	})

	test('does NOT fire for coordinator own posts', async () => {
		const calls: ChatEntry[] = []
		mailboxWatcher.onCoordMail = (entry) => {
			calls.push(entry)
		}

		mailboxWatcher.watchAgent({
			agentId: COORD_ID,
			agentDir: projectAgentDir,
			projectDir,
			coordinatorId: COORD_ID,
		})

		// Coordinator replying in chat — fromAgentId matches coord.
		appendProjectChat(
			projectAgentDir,
			makeChatEntry({ fromAgentId: COORD_ID, kind: 'result' }),
		)

		await sleep(500)

		expect(calls).toHaveLength(0)
	})

	test('fires for multiple distinct worker messages in order', async () => {
		const calls: ChatEntry[] = []
		mailboxWatcher.onCoordMail = (entry) => {
			calls.push(entry)
		}

		mailboxWatcher.watchAgent({
			agentId: COORD_ID,
			agentDir: projectAgentDir,
			projectDir,
			coordinatorId: COORD_ID,
		})

		const a = makeChatEntry({ fromAgentId: 'worker-a', kind: 'request', ts: 100 })
		const b = makeChatEntry({ fromAgentId: 'worker-b', kind: 'question', ts: 200 })
		appendProjectChat(projectAgentDir, a)
		appendProjectChat(projectAgentDir, b)

		await sleep(500)

		expect(calls.map((c) => c.id)).toEqual([a.id, b.id])
	})

	test('member agent without projectDir does NOT watch project chat', async () => {
		// Members don't get onCoordMail events because they aren't the
		// coordinator. The watcher is per-coord; the renderer drives
		// the project-Inbox-tab aggregation in commit 13.
		const calls: ChatEntry[] = []
		mailboxWatcher.onCoordMail = (entry) => {
			calls.push(entry)
		}

		mailboxWatcher.watchAgent({
			agentId: MEMBER_ID,
			agentDir: memberDir,
			// no projectDir — pure member
		})

		appendProjectChat(
			projectAgentDir,
			makeChatEntry({ fromAgentId: 'worker-other', kind: 'broadcast' }),
		)

		await sleep(500)

		expect(calls).toHaveLength(0)
	})
})

describe('MailboxWatcher — error resilience', () => {
	test('does not throw when the inbox file is missing initially', async () => {
		const calls: InboxEntry[] = []
		mailboxWatcher.onMemberMail = (_memberId, entry) => {
			calls.push(entry)
		}

		// Watch a dir with no inbox.jsonl.
		const emptyDir = join(sandbox, 'agent-empty')
		mkdirSync(emptyDir, { recursive: true })

		mailboxWatcher.watchAgent({ agentId: 'empty', agentDir: emptyDir })

		// Later create the file and append.
		appendMemberInbox(emptyDir, makeInboxEntry({ toAgentId: 'empty' }))

		await sleep(500)

		expect(calls).toHaveLength(1)
	})

	test('skips malformed lines without throwing', async () => {
		const calls: InboxEntry[] = []
		mailboxWatcher.onMemberMail = (_memberId, entry) => {
			calls.push(entry)
		}

		mailboxWatcher.watchAgent({ agentId: MEMBER_ID, agentDir: memberDir })

		// Inject a malformed line then a good one.
		appendFileSync(join(memberDir, 'inbox.jsonl'), 'not json\n', 'utf8')
		const good = makeInboxEntry()
		appendMemberInbox(memberDir, good)

		await sleep(500)

		expect(calls).toHaveLength(1)
		expect(calls[0]?.id).toBe(good.id)
	})
})

describe('MailboxWatcher — cold-start wake', () => {
	test('fires onMemberMail immediately for pending entries written before watchAgent', async () => {
		// Worker was offline when coordinator wrote these. The inbox
		// already has 2 pending entries.
		const a = makeInboxEntry({ toAgentId: 'late-agent' })
		const b = makeInboxEntry({ toAgentId: 'late-agent' })
		appendMemberInbox(memberDir, a)
		appendMemberInbox(memberDir, b)

		const calls: InboxEntry[] = []
		mailboxWatcher.onMemberMail = (_memberId, entry) => {
			calls.push(entry)
		}

		// Now the worker comes online and the watcher starts watching.
		mailboxWatcher.watchAgent({ agentId: 'late-agent', agentDir: memberDir })

		// Cold-start: should fire onMemberMail twice without waiting
		// for the 5s polling tick.
		await sleep(100)
		expect(calls).toHaveLength(2)
		expect(calls[0]?.id).toBe(a.id)
		expect(calls[1]?.id).toBe(b.id)
	})

	test('cold-start wake does not refire on the next polling tick', async () => {
		const a = makeInboxEntry({ toAgentId: 'late-agent-2' })
		appendMemberInbox(memberDir, a)

		const calls: InboxEntry[] = []
		mailboxWatcher.onMemberMail = (_memberId, entry) => {
			calls.push(entry)
		}

		mailboxWatcher.watchAgent({ agentId: 'late-agent-2', agentDir: memberDir })
		await sleep(100)
		expect(calls).toHaveLength(1)

		// Wait past the polling interval; the entry should not refire.
		await sleep(4800)
		expect(calls).toHaveLength(1)
	}, 8000)
})
