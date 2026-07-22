/**
 * Unit tests for `runtime/spawn.ts`.
 *
 * Covers the high-level lifecycle methods (stop, restart, send,
 * pruneStaleEntries, removeEntry). `spawnProcess` requires a real
 * ChildProcess and is exercised end-to-end via the existing
 * integration tests in main.ts / preload.ts — not unit-tested here.
 *
 * `electron-log/main` and `../agent-chat-store` are mocked so the
 * tests do not touch the disk or the network.
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

const hydrated: string[] = []
mock.module('../agent-chat-store', () => ({
	appendBatch: async () => {},
	trimTo: async () => {},
	chatFilePath: (agentDir: string) => `${agentDir}/chat.jsonl`,
	readAll: async (path: string) => {
		hydrated.push(path)
		return []
	},
}))

const { stop, restart, send, pruneStaleEntries, removeEntry } = await import('./spawn')

function makeRt(overrides: Partial<any> = {}) {
	const entries = new Map<string, any>()
	const statusTransitions: Array<{ from: string; to: string }> = []
	const emits: string[] = []

	const rt: any = {
		entries,
		adapterFactories: new Map(),
		silenceTimers: new Map(),
		readyEmitted: new Set(),
		settingsWatchers: new Map(),
		telemetryTailers: new Map(),
		lastSeenCounter: new Map(),
		isRunning(_agentId: string) {
			return false
		},
		start(_agentId: string, _dir: string, _src: string) {
			return Promise.resolve()
		},
		stop(agentId: string) {
			stop(rt, agentId)
		},
		send(agentId: string, text: string) {
			return send(rt, agentId, text)
		},
		transitionStatus(entry: any, next: string) {
			statusTransitions.push({ from: entry.status, to: next })
			entry.status = next
		},
		emitMessages(agentId: string) {
			emits.push(`messages:${agentId}`)
		},
		scheduleChatPersist(_entry: any) {
			emits.push('scheduleChatPersist')
		},
		clearSilenceTimer(agentId: string) {
			emits.push(`clearSilence:${agentId}`)
		},
		terminateProcess(_proc: any) {
			emits.push('terminate')
		},
		flushChatEntry(_entry: any) {
			return Promise.resolve()
		},
		flushAllChats() {
			return Promise.resolve()
		},
		startTelemetryTailer(_entry: any) {
			emits.push('startTelemetry')
		},
		stopTelemetryTailer(agentId: string) {
			emits.push(`stopTelemetry:${agentId}`)
		},
		closeSettingsWatcher(agentId: string) {
			emits.push(`closeSettings:${agentId}`)
		},
		closeAllSettingsWatchers() {
			emits.push('closeAllSettings')
		},
		emitStatus(_agentId: string) {},
		resolveAgentKindSync(_agentId: string) {
			return 'standard'
		},
		...overrides,
	}
	return { rt, entries, statusTransitions, emits }
}

function makeEntry(overrides: Partial<any> = {}) {
	return {
		agentId: 'a1',
		agentDir: '/tmp/a1',
		manifestPiSource: '/tmp/pi',
		process: null,
		status: 'active',
		messages: [],
		stderrLog: [],
		adapter: { serializeInput: (t: string) => t, reset: () => {} },
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

describe('spawn.stop', () => {
	let ctx: ReturnType<typeof makeRt>
	beforeEach(() => {
		ctx = makeRt()
	})

	test('with no entry, no-op', () => {
		stop(ctx.rt, 'nope')
		expect(ctx.statusTransitions.length).toBe(0)
	})

	test('with entry but no process, transitions to idle', () => {
		const entry = makeEntry({ status: 'busy' })
		ctx.entries.set('a1', entry)
		stop(ctx.rt, 'a1')
		expect(ctx.statusTransitions).toEqual([{ from: 'busy', to: 'idle' }])
	})

	test('with entry and live process, terminates + schedules SIGTERM', () => {
		const entry = makeEntry({ process: { killed: false, kill: () => {} } })
		ctx.entries.set('a1', entry)
		stop(ctx.rt, 'a1')
		expect(ctx.emits).toContain('terminate')
		expect(ctx.emits).toContain('clearSilence:a1')
	})
})

describe('spawn.restart', () => {
	let ctx: ReturnType<typeof makeRt>
	beforeEach(() => {
		ctx = makeRt()
	})

	test('no-op when entry is missing', () => {
		restart(ctx.rt, 'nope')
		expect(ctx.emits.length).toBe(0)
	})

	test('calls stop then schedules start with 800ms delay', () => {
		const entry = makeEntry()
		ctx.entries.set('a1', entry)
		restart(ctx.rt, 'a1')
		expect(ctx.emits).toContain('clearSilence:a1')
	})
})

describe('spawn.send', () => {
	let ctx: ReturnType<typeof makeRt>
	beforeEach(() => {
		ctx = makeRt()
	})

	test('returns false when entry is missing', () => {
		expect(send(ctx.rt, 'nope', 'hello')).toBe(false)
	})

	test('returns false when entry has no process', () => {
		const entry = makeEntry({ process: null })
		ctx.entries.set('a1', entry)
		expect(send(ctx.rt, 'a1', 'hello')).toBe(false)
	})

	test('returns false for empty / whitespace text', () => {
		const entry = makeEntry({ process: { stdin: { write: () => {} } } })
		ctx.entries.set('a1', entry)
		expect(send(ctx.rt, 'a1', '   ')).toBe(false)
		expect(ctx.statusTransitions.length).toBe(0)
	})

	test('happy path: pushes user msg, schedules persist, transitions busy, writes stdin, returns true', () => {
		let written = ''
		const entry = makeEntry({
			process: { stdin: { write: (s: string) => { written = s } } },
		})
		ctx.entries.set('a1', entry)
		const ok = send(ctx.rt, 'a1', 'hello')

		expect(ok).toBe(true)
		expect(entry.messages.length).toBe(1)
		expect((entry.messages[0] as any).role).toBe('user')
		expect((entry.messages[0] as any).text).toBe('hello')
		expect(entry._chatPending.has((entry.messages[0] as any).id)).toBe(true)
		expect(ctx.emits).toContain('scheduleChatPersist')
		expect(ctx.emits).toContain('messages:a1')
		expect(ctx.statusTransitions).toEqual([{ from: 'active', to: 'busy' }])
		expect(written.length).toBeGreaterThan(0)
	})

	test('stdin write throws → sets lastError, transitions to idle, returns false', () => {
		const entry: any = makeEntry({
			process: { stdin: { write: () => { throw new Error('EPIPE') } } },
		})
		ctx.entries.set('a1', entry)
		const ok = send(ctx.rt, 'a1', 'hi')

		expect(ok).toBe(false)
		expect(entry.lastError).toBe('EPIPE')
		expect(ctx.statusTransitions).toEqual([
			{ from: 'active', to: 'busy' },
			{ from: 'busy', to: 'idle' },
		])
	})
})

describe('spawn.pruneStaleEntries', () => {
	let ctx: ReturnType<typeof makeRt>
	beforeEach(() => {
		ctx = makeRt()
	})

	test('removes entries whose agentDir no longer exists', () => {
		const stale = makeEntry({ agentDir: '/tmp/does-not-exist-' + Math.random() })
		const live = makeEntry({ agentDir: process.cwd() })
		ctx.entries.set('stale', stale)
		ctx.entries.set('live', live)

		pruneStaleEntries(ctx.rt)

		expect(ctx.entries.has('stale')).toBe(false)
		expect(ctx.entries.has('live')).toBe(true)
		expect(ctx.emits).toContain('stopTelemetry:stale')
		expect(ctx.emits).toContain('clearSilence:stale')
	})

	test('no-op when all entries point at existing dirs', () => {
		const live = makeEntry({ agentDir: process.cwd() })
		ctx.entries.set('live', live)
		pruneStaleEntries(ctx.rt)
		expect(ctx.entries.size).toBe(1)
	})
})

describe('spawn.removeEntry', () => {
	let ctx: ReturnType<typeof makeRt>
	beforeEach(() => {
		ctx = makeRt()
	})

	test('clears all per-agent state and deletes the entry', () => {
		const entry = makeEntry()
		ctx.entries.set('a1', entry)
		ctx.rt.lastSeenCounter.set('a1', 5)
		ctx.rt.readyEmitted.add('a1')

		removeEntry(ctx.rt, 'a1')

		expect(ctx.entries.has('a1')).toBe(false)
		expect(ctx.rt.lastSeenCounter.has('a1')).toBe(false)
		expect(ctx.rt.readyEmitted.has('a1')).toBe(false)
		expect(ctx.emits).toContain('clearSilence:a1')
		expect(ctx.emits).toContain('closeSettings:a1')
		expect(ctx.emits).toContain('stopTelemetry:a1')
	})
})
