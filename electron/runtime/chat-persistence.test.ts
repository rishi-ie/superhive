/**
 * Unit tests for `runtime/chat-persistence.ts`.
 *
 * Mock `electron-log/main` and `../agent-chat-store` so the test does
 * not touch the disk. Use a fake `rt` for the same reason as
 * event-router.test.ts.
 */

import { describe, expect, test, beforeEach, mock } from 'bun:test'

mock.module('electron-log/main', () => ({
	default: {
		info: () => {},
		debug: () => {},
		warn: () => {},
		error: () => {},
	},
}))

const appendedBatches: Array<{ path: string; rows: unknown[] }> = []
const trimmed: Array<{ path: string; cap: number }> = []

mock.module('../agent-chat-store', () => ({
	appendBatch: async (path: string, rows: unknown[]) => {
		appendedBatches.push({ path, rows })
	},
	trimTo: async (path: string, cap: number) => {
		trimmed.push({ path, cap })
	},
	chatFilePath: (agentDir: string) => `${agentDir}/chat.jsonl`,
	readAll: async () => [],
}))

const {
	scheduleChatPersist,
	flushChatEntry,
	flushAllChats,
	persistAssistantMessage,
	resetSilenceTimer,
	clearSilenceTimer,
	maybeEmitReady,
} = await import('./chat-persistence')

function makeRt() {
	const entries = new Map<string, any>()
	const statusTransitions: Array<{ from: string; to: string }> = []
	const emittedStatuses: string[] = []
	const emittedEvents: Array<unknown> = []

	const rt: any = {
		entries,
		silenceTimers: new Map<string, NodeJS.Timeout>(),
		readyEmitted: new Set<string>(),
		transitionStatus(entry: any, next: string) {
			statusTransitions.push({ from: entry.status, to: next })
			entry.status = next
		},
		emitStatus(agentId: string) {
			emittedStatuses.push(agentId)
		},
		emitEvent(_agentId: string, event: unknown) {
			emittedEvents.push(event)
		},
		scheduleChatPersist(entry: any) {
			scheduleChatPersist(rt, entry)
		},
		flushChatEntry(entry: any) {
			return flushChatEntry(rt, entry)
		},
	}

	return { rt, entries, statusTransitions, emittedStatuses, emittedEvents }
}

function makeEntry(overrides: Partial<any> = {}): any {
	return {
		agentId: 'a1',
		agentDir: '/tmp/a1',
		manifestPiSource: '/tmp/pi',
		process: { killed: false },
		status: 'active',
		messages: [],
		stderrLog: [],
		adapter: { reset: () => {} },
		usage: undefined,
		contextUsage: undefined,
		extensionLoaded: false,
		availableModels: undefined,
		_chatPending: new Set<string>(),
		_chatDebounceTimer: null,
		_inFlightTools: new Map(),
		...overrides,
	}
}

describe('chat-persistence.scheduleChatPersist + flushChatEntry', () => {
	let ctx: ReturnType<typeof makeRt>
	beforeEach(() => {
		ctx = makeRt()
		appendedBatches.length = 0
		trimmed.length = 0
	})

	test('scheduleChatPersist sets a debounce timer; flushChatEntry persists rows', async () => {
		const entry = makeEntry()
		entry.messages.push({
			id: 'm1',
			role: 'user',
			timestamp: 1,
			text: 'hello',
		})
		entry._chatPending.add('m1')
		ctx.entries.set('a1', entry)

		scheduleChatPersist(ctx.rt, entry)
		expect(entry._chatDebounceTimer).not.toBeNull()

		await flushChatEntry(ctx.rt, entry)

		expect(entry._chatDebounceTimer).toBeNull()
		expect(appendedBatches.length).toBe(1)
		expect(appendedBatches[0]!.path).toBe('/tmp/a1/chat.jsonl')
		expect(appendedBatches[0]!.rows.length).toBe(1)
		expect(entry._chatPending.size).toBe(0)
	})

	test('flushChatEntry is a no-op when _chatPending is empty', async () => {
		const entry = makeEntry()
		ctx.entries.set('a1', entry)
		await flushChatEntry(ctx.rt, entry)
		expect(appendedBatches.length).toBe(0)
	})

	test('flushChatEntry trims when message count exceeds cap', async () => {
		const entry = makeEntry()
		// Fill messages beyond AGENT_CHAT_MESSAGE_CAP (5000)
		for (let i = 0; i < 5001; i++) {
			entry.messages.push({ id: `m${i}`, role: 'user', timestamp: i, text: 'x' })
			entry._chatPending.add(`m${i}`)
		}
		ctx.entries.set('a1', entry)

		await flushChatEntry(ctx.rt, entry)
		expect(trimmed.length).toBe(1)
		expect(trimmed[0]!.cap).toBe(5000)
	})
})

describe('chat-persistence.persistAssistantMessage', () => {
	let ctx: ReturnType<typeof makeRt>
	beforeEach(() => {
		ctx = makeRt()
		appendedBatches.length = 0
	})

	test('appends a new message and queues it for persistence', () => {
		const entry = makeEntry()
		ctx.entries.set('a1', entry)
		persistAssistantMessage(ctx.rt, 'a1', {
			id: 'asst-1',
			role: 'assistant',
			timestamp: 1,
			activityTimeline: [],
			response: [],
			metadata: {},
		} as any)
		expect(entry.messages.length).toBe(1)
		expect(entry._chatPending.has('asst-1')).toBe(true)
		expect(entry._chatDebounceTimer).not.toBeNull()
	})

	test('replaces an existing message by id (idempotent)', () => {
		const entry = makeEntry()
		entry.messages.push({
			id: 'asst-1',
			role: 'assistant',
			timestamp: 1,
			activityTimeline: [],
			response: [{ kind: 'text', text: 'first' }],
			metadata: {},
		})
		ctx.entries.set('a1', entry)

		persistAssistantMessage(ctx.rt, 'a1', {
			id: 'asst-1',
			role: 'assistant',
			timestamp: 2,
			activityTimeline: [],
			response: [{ kind: 'text', text: 'final' }],
			metadata: {},
		} as any)

		expect(entry.messages.length).toBe(1)
		expect((entry.messages[0] as any).response[0].text).toBe('final')
	})

	test('returns silently when agent is unknown', () => {
		persistAssistantMessage(ctx.rt, 'nope', {
			id: 'asst-1',
			role: 'assistant',
			timestamp: 1,
			activityTimeline: [],
			response: [],
			metadata: {},
		} as any)
		expect(appendedBatches.length).toBe(0)
	})
})

describe('chat-persistence.flushAllChats', () => {
	let ctx: ReturnType<typeof makeRt>
	beforeEach(() => {
		ctx = makeRt()
		appendedBatches.length = 0
	})

	test('flushes every entry in parallel', async () => {
		const e1 = makeEntry({ agentDir: '/tmp/a1' })
		e1.messages.push({ id: 'm1', role: 'user', timestamp: 1, text: 'x' })
		e1._chatPending.add('m1')
		const e2 = makeEntry({ agentDir: '/tmp/a2' })
		e2.messages.push({ id: 'm2', role: 'user', timestamp: 2, text: 'y' })
		e2._chatPending.add('m2')
		ctx.entries.set('a1', e1)
		ctx.entries.set('a2', e2)

		await flushAllChats(ctx.rt)
		expect(appendedBatches.length).toBe(2)
	})
})

describe('chat-persistence readiness detection', () => {
	let ctx: ReturnType<typeof makeRt>
	beforeEach(() => {
		ctx = makeRt()
	})

	test('resetSilenceTimer arms a 2s timer that calls maybeEmitReady', () => {
		const entry = makeEntry({ status: 'busy', process: { killed: false } })
		ctx.entries.set('a1', entry)
		resetSilenceTimer(ctx.rt, entry)
		expect(ctx.rt.silenceTimers.has('a1')).toBe(true)
	})

	test('clearSilenceTimer removes the timer', () => {
		const entry = makeEntry({ status: 'busy' })
		ctx.entries.set('a1', entry)
		resetSilenceTimer(ctx.rt, entry)
		expect(ctx.rt.silenceTimers.has('a1')).toBe(true)
		clearSilenceTimer(ctx.rt, 'a1')
		expect(ctx.rt.silenceTimers.has('a1')).toBe(false)
	})

	test('maybeEmitReady transitions to active and emits boot-step + ready', () => {
		const entry = makeEntry({ status: 'busy', process: { killed: false } })
		ctx.entries.set('a1', entry)
		maybeEmitReady(ctx.rt, 'a1')

		expect(entry.status).toBe('active')
		expect(entry.bootStep).toBe('ready')
		expect(ctx.rt.readyEmitted.has('a1')).toBe(true)
		expect(ctx.emittedStatuses).toContain('a1')
		expect(ctx.emittedEvents.length).toBe(2)
		const eventTypes = ctx.emittedEvents.map((e: any) => e.type)
		expect(eventTypes).toEqual(['boot-step', 'ready'])
	})

	test('maybeEmitReady is idempotent — second call is a no-op', () => {
		const entry = makeEntry({ status: 'busy', process: { killed: false } })
		ctx.entries.set('a1', entry)
		maybeEmitReady(ctx.rt, 'a1')
		const firstEmits = ctx.emittedEvents.length
		const firstTransitions = ctx.statusTransitions.length

		maybeEmitReady(ctx.rt, 'a1')
		expect(ctx.emittedEvents.length).toBe(firstEmits)
		expect(ctx.statusTransitions.length).toBe(firstTransitions)
	})

	test('maybeEmitReady is a no-op when status is idle', () => {
		const entry = makeEntry({ status: 'idle', process: null })
		ctx.entries.set('a1', entry)
		maybeEmitReady(ctx.rt, 'a1')
		expect(entry.status).toBe('idle')
		expect(ctx.rt.readyEmitted.has('a1')).toBe(false)
		expect(ctx.emittedEvents.length).toBe(0)
	})
})
