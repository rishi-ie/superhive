/**
 * Tests for the Gap 2 mailbox handlers.
 *
 * Imports from electron/ipc/mailbox-handlers.ts (the pure module — no
 * electron dep) so the test file doesn't need to mock electron.
 *
 * Storage mocks: AgentRepository is mocked for getAllSync; the truth
 * settings files are written to a tmp dir; the userData path is mocked
 * via `getUserDataPath`.
 *
 * Run: `bun test electron/ipc/mailbox.test.ts`
 */

import { describe, expect, test, beforeEach, afterEach, mock } from 'bun:test'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const PROJECT_ID = 'proj-uuid-1'
const COORD_ID = 'coord-uuid-1'
const MEMBER_ID = 'member-uuid-1'

let tmpRoot: string
let coordDir: string
let memberDir: string

const fakeAgentRows = [
	{
		id: COORD_ID,
		name: 'Coordinator',
		// populated in beforeEach
		localPath: '',
		projectIds: [PROJECT_ID],
	},
	{
		id: MEMBER_ID,
		name: 'Backend Engineer',
		localPath: '',
		projectIds: [PROJECT_ID],
	},
]

mock.module('../../src/storage/repositories/AgentRepository', () => ({
	AgentRepository: {
		getAllSync: () => fakeAgentRows,
		getAll: async () => fakeAgentRows,
	},
}))

mock.module('../../src/storage/repositories/ProjectRepository', () => ({
	ProjectRepository: {
		getById: async (id: string) =>
			id === PROJECT_ID ? { id: PROJECT_ID, localPath: join(tmpRoot, 'project-x') } : undefined,
	},
}))

beforeEach(() => {
	tmpRoot = mkdtempSync(join(tmpdir(), 'mailbox-ipc-test-'))
	coordDir = join(tmpRoot, 'project-x', 'agent')
	memberDir = join(tmpRoot, 'member-b')
	mkdirSync(coordDir, { recursive: true })
	mkdirSync(memberDir, { recursive: true })

	fakeAgentRows[0]!.localPath = coordDir
	fakeAgentRows[1]!.localPath = memberDir

	writeFileSync(
		join(coordDir, 'Superhive-pi-agent.json'),
		JSON.stringify({
			project: {
				id: PROJECT_ID,
				name: 'Test Project',
				description: '',
				members: [],
				localPath: join(tmpRoot, 'project-x'),
				coordinatorAgentId: COORD_ID,
			},
		}),
	)

	// Write the member's settings file too — the handler reads
	// settings from the SENDER's truth file to find project.localPath.
	writeFileSync(
		join(memberDir, 'Superhive-pi-member-b.json'),
		JSON.stringify({
			project: {
				id: PROJECT_ID,
				name: 'Test Project',
				description: '',
				members: [],
				localPath: join(tmpRoot, 'project-x'),
				coordinatorAgentId: COORD_ID,
			},
		}),
	)

	mock.module('../../src/storage/database', () => ({
		getUserDataPath: () => tmpRoot,
		setUserDataPath: () => {},
		loadDb: async () => ({ data: [], write: async () => {} }),
	}))
})

afterEach(() => {
	if (existsSync(tmpRoot)) {
		rmSync(tmpRoot, { recursive: true, force: true })
	}
})

const NOOP_HOOKS = {
	broadcastAgentMail: () => {},
	broadcastMailboxChanged: () => {},
}

describe('handlePostToProject', () => {
	test('writes a tagged entry to the project chat', async () => {
		const { handlePostToProject } = await import('./mailbox-handlers')
		const result = handlePostToProject(MEMBER_ID, { body: 'I need the API spec', kind: 'request' }, NOOP_HOOKS)

		expect(result.ok).toBe(true)
		expect(result.messageId).toBeDefined()

		const chatPath = join(coordDir, 'chat.jsonl')
		expect(existsSync(chatPath)).toBe(true)
		const { readFileSync } = await import('node:fs')
		const raw = readFileSync(chatPath, 'utf8')
		const entry = JSON.parse(raw.trim())
		expect(entry.fromAgentId).toBe(MEMBER_ID)
		expect(entry.kind).toBe('request')
		expect(entry.parts[0].text).toBe('I need the API spec')
	})

	test('returns ok:false when agent is not in a project', async () => {
		const { handlePostToProject } = await import('./mailbox-handlers')
		const result = handlePostToProject('no-such-agent', { body: 'x' }, NOOP_HOOKS)
		expect(result.ok).toBe(false)
		expect(result.error).toMatch(/not in a project/i)
	})
})

describe('handleAskMember', () => {
	test('writes an entry to the recipient member inbox', async () => {
		const { handleAskMember } = await import('./mailbox-handlers')
		const result = handleAskMember(COORD_ID, {
			toAgentId: MEMBER_ID,
			body: 'please answer',
			kind: 'request',
		}, NOOP_HOOKS)

		expect(result.ok).toBe(true)
		expect(result.messageId).toBeDefined()

		const inboxPath = join(memberDir, 'inbox.jsonl')
		expect(existsSync(inboxPath)).toBe(true)
		const { readFileSync } = await import('node:fs')
		const raw = readFileSync(inboxPath, 'utf8')
		const entry = JSON.parse(raw.trim())
		expect(entry.fromAgentId).toBe(COORD_ID)
		expect(entry.toAgentId).toBe(MEMBER_ID)
		expect(entry.status).toBe('pending')
	})

	test('returns ok:false for unknown recipient', async () => {
		const { handleAskMember } = await import('./mailbox-handlers')
		const result = handleAskMember(COORD_ID, { toAgentId: 'no-such', body: 'x' }, NOOP_HOOKS)
		expect(result.ok).toBe(false)
		expect(result.error).toMatch(/unknown agent/i)
	})
})

describe('handleReadInbox', () => {
	test('coordinator sees worker posts in the project chat', async () => {
		const { appendProjectChat } = await import('../mailbox-store')
		appendProjectChat(coordDir, {
			id: 'm-1',
			ts: 1000,
			role: 'assistant',
			parts: [{ type: 'text', text: 'worker question' }],
			fromAgentId: MEMBER_ID,
			fromAgentName: 'Backend Engineer',
			kind: 'request',
		})

		const { handleReadInbox } = await import('./mailbox-handlers')
		const items = handleReadInbox(COORD_ID, { limit: 50 })

		expect(items).toHaveLength(1)
		expect(items[0]?.id).toBe('m-1')
		expect(items[0]?.fromAgentId).toBe(MEMBER_ID)
		expect(items[0]?.kind).toBe('request')
		expect(items[0]?.body).toBe('worker question')
	})

	test('member sees entries in their own inbox', async () => {
		const { appendMemberInbox } = await import('../mailbox-store')
		appendMemberInbox(memberDir, {
			id: 'm-1',
			ts: 1000,
			fromAgentId: COORD_ID,
			toAgentId: MEMBER_ID,
			kind: 'request',
			body: 'answer please',
			status: 'pending',
		})

		const { handleReadInbox } = await import('./mailbox-handlers')
		const items = handleReadInbox(MEMBER_ID, { limit: 50 })

		expect(items).toHaveLength(1)
		expect(items[0]?.id).toBe('m-1')
		expect(items[0]?.body).toBe('answer please')
	})

	test('markAsRead flips pending → acked in the member inbox', async () => {
		const { appendMemberInbox } = await import('../mailbox-store')
		appendMemberInbox(memberDir, {
			id: 'm-1',
			ts: 1000,
			fromAgentId: COORD_ID,
			toAgentId: MEMBER_ID,
			kind: 'request',
			body: 'x',
			status: 'pending',
		})

		const { handleReadInbox } = await import('./mailbox-handlers')
		handleReadInbox(MEMBER_ID, { markAsRead: true })

		// Wait for async ack to flush.
		await new Promise((r) => setTimeout(r, 50))

		const { readMemberInbox } = await import('../mailbox-store')
		const items = readMemberInbox(memberDir)
		expect(items[0]?.status).toBe('acked')
	})
})

describe('handleAckMessage', () => {
	test('member acks a pending inbox entry', async () => {
		const { appendMemberInbox } = await import('../mailbox-store')
		appendMemberInbox(memberDir, {
			id: 'm-1',
			ts: 1000,
			fromAgentId: COORD_ID,
			toAgentId: MEMBER_ID,
			kind: 'request',
			body: 'x',
			status: 'pending',
		})

		const { handleAckMessage } = await import('./mailbox-handlers')
		const result = handleAckMessage(MEMBER_ID, 'm-1', NOOP_HOOKS)
		expect(result.ok).toBe(true)

		// Wait for async ack to flush.
		await new Promise((r) => setTimeout(r, 50))

		const { readMemberInbox } = await import('../mailbox-store')
		const items = readMemberInbox(memberDir)
		expect(items[0]?.status).toBe('acked')
	})
})
