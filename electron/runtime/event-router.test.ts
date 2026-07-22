/**
 * Unit tests for `runtime/event-router.ts`.
 *
 * AdapterEvent dispatch is pure logic on top of the runtime entry plus
 * the broadcast/state-machine helpers. We pass a fake `rt` object
 * (constructed inline) so the test does NOT import
 * `general-kai-runtime.ts` — that would pull in the whole ipc/ tree.
 *
 * `electron-log/main` is mocked to a no-op so the module's log.debug
 * calls don't fail.
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

const { handleAdapterEvent } = await import('./event-router')

type FakeEntry = any

function makeRt() {
	const statusTransitions: Array<{ from: string; to: string }> = []
	const emittedStatuses: string[] = []
	const emittedEvents: Array<{ agentId: string; event: unknown }> = []
	const entries = new Map<string, FakeEntry>()

	const rt = {
		entries,
		emitStatus(agentId: string) {
			emittedStatuses.push(agentId)
		},
		emitEvent(agentId: string, event: unknown) {
			emittedEvents.push({ agentId, event })
		},
		transitionStatus(entry: FakeEntry, next: string) {
			statusTransitions.push({ from: entry.status, to: next })
			entry.status = next
		},
	}

	return { rt, entries, statusTransitions, emittedStatuses, emittedEvents }
}

function makeEntry(overrides: Partial<any> = {}): any {
	return {
		agentId: 'a1',
		agentDir: '/tmp/a1',
		manifestPiSource: '/tmp/pi',
		process: null,
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

describe('event-router.handleAdapterEvent', () => {
	let ctx: ReturnType<typeof makeRt>
	beforeEach(() => {
		ctx = makeRt()
	})

	test('returns early when entry is missing', () => {
		handleAdapterEvent(ctx.rt as any, 'nope', { type: 'ready' })
		expect(ctx.emittedEvents.length).toBe(0)
		expect(ctx.emittedStatuses.length).toBe(0)
	})

	test('boot-step sets entry.bootStep and emits status', () => {
		const entry = makeEntry()
		ctx.entries.set('a1', entry)
		handleAdapterEvent(ctx.rt as any, 'a1', { type: 'boot-step', step: 'connecting-chat' })
		expect(entry.bootStep).toBe('connecting-chat')
		expect(ctx.emittedStatuses).toContain('a1')
	})

	test('ready transitions status to active', () => {
		const entry = makeEntry({ status: 'busy' })
		ctx.entries.set('a1', entry)
		handleAdapterEvent(ctx.rt as any, 'a1', { type: 'ready' })
		expect(ctx.statusTransitions).toEqual([{ from: 'busy', to: 'active' }])
	})

	test('message-start transitions to busy and forwards event', () => {
		const entry = makeEntry({ status: 'active' })
		ctx.entries.set('a1', entry)
		handleAdapterEvent(ctx.rt as any, 'a1', {
			type: 'message-start',
			messageId: 'm1',
			role: 'assistant',
		})
		expect(ctx.statusTransitions).toEqual([{ from: 'active', to: 'busy' }])
		expect(ctx.emittedEvents.length).toBe(1)
		expect((ctx.emittedEvents[0]!.event as any).type).toBe('message-start')
	})

	test('message-end transitions to active and forwards event', () => {
		const entry = makeEntry({ status: 'busy' })
		ctx.entries.set('a1', entry)
		handleAdapterEvent(ctx.rt as any, 'a1', { type: 'message-end', messageId: 'm1' })
		expect(ctx.statusTransitions).toEqual([{ from: 'busy', to: 'active' }])
		expect(ctx.emittedEvents.length).toBe(1)
	})

	test('error sets entry.lastError, transitions, and forwards', () => {
		const entry = makeEntry({ status: 'busy' })
		ctx.entries.set('a1', entry)
		handleAdapterEvent(ctx.rt as any, 'a1', {
			type: 'error',
			message: 'boom',
			recoverable: true,
		})
		expect(entry.lastError).toBe('boom')
		expect(ctx.statusTransitions).toEqual([{ from: 'busy', to: 'active' }])
		expect(ctx.emittedEvents.length).toBe(1)
	})

	test('usage is dropped (no-op) when extension is loaded', () => {
		const entry = makeEntry({
			extensionLoaded: true,
			usage: { input: 1, output: 2, cacheRead: 0, cacheWrite: 0, totalTokens: 3 },
		})
		ctx.entries.set('a1', entry)
		handleAdapterEvent(ctx.rt as any, 'a1', {
			type: 'usage',
			usage: { input: 999, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 999 },
		})
		expect(entry.usage.input).toBe(1)
	})

	test('usage sets entry.usage when extension is NOT loaded', () => {
		const entry = makeEntry({ extensionLoaded: false })
		ctx.entries.set('a1', entry)
		const usage = { input: 5, output: 6, cacheRead: 0, cacheWrite: 0, totalTokens: 11 }
		handleAdapterEvent(ctx.rt as any, 'a1', { type: 'usage', usage })
		expect(entry.usage).toEqual(usage)
	})

	test('compaction-start sets entry.compaction and emits', () => {
		const entry = makeEntry()
		ctx.entries.set('a1', entry)
		handleAdapterEvent(ctx.rt as any, 'a1', { type: 'compaction-start', reason: 'threshold' })
		expect(entry.compaction.reason).toBe('threshold')
		expect(ctx.emittedStatuses).toContain('a1')
		expect(ctx.emittedEvents.length).toBe(1)
	})

	test('compaction-end clears entry.compaction and emits', () => {
		const entry = makeEntry({ compaction: { reason: 'old', startedAt: 1 } })
		ctx.entries.set('a1', entry)
		handleAdapterEvent(ctx.rt as any, 'a1', {
			type: 'compaction-end',
			reason: 'manual',
			aborted: false,
			willRetry: false,
		})
		expect(entry.compaction).toBeUndefined()
	})

	test('auto-retry-start sets entry.retry and emits', () => {
		const entry: any = makeEntry()
		ctx.entries.set('a1', entry)
		handleAdapterEvent(ctx.rt as any, 'a1', {
			type: 'auto-retry-start',
			attempt: 1,
			maxAttempts: 3,
			delayMs: 500,
			errorMessage: 'transient',
		})
		expect(entry.retry.attempt).toBe(1)
		expect(entry.retry.maxAttempts).toBe(3)
	})

	test('auto-retry-end clears entry.retry and emits', () => {
		const entry: any = makeEntry({
			retry: { attempt: 1, maxAttempts: 3, delayMs: 0, errorMessage: 'x', startedAt: 1 },
		})
		ctx.entries.set('a1', entry)
		handleAdapterEvent(ctx.rt as any, 'a1', {
			type: 'auto-retry-end',
			success: true,
			attempt: 1,
		})
		expect(entry.retry).toBeUndefined()
	})

	test('text-delta (forward-only) emits without mutating entry', () => {
		const entry = makeEntry({ status: 'busy' })
		ctx.entries.set('a1', entry)
		handleAdapterEvent(ctx.rt as any, 'a1', {
			type: 'text-delta',
			messageId: 'm1',
			delta: 'hi',
		})
		expect(entry.status).toBe('busy')
		expect(ctx.emittedEvents.length).toBe(1)
	})
})
