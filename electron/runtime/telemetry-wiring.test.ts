/**
 * Unit tests for `runtime/telemetry-wiring.ts`.
 *
 * Equality helpers are pure functions — exercised directly. The
 * `handleTelemetryEvent` dispatch takes a fake `rt` (same pattern as
 * event-router.test.ts) so the test does not import the orchestrator
 * class.
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

// Don't pull in the full ipc/ tree — telemetry-wiring only needs the
// IPC.SETTINGS.ON_MODEL_UPDATED channel string. Provide a minimal stub.
mock.module('../ipc/index', () => ({
	IPC: {
		SETTINGS: {
			ON_MODEL_UPDATED: 'settings:model-updated',
		},
	},
}))

const {
	usageEquals,
	contextUsageEquals,
	modelsEqual,
	handleTelemetryEvent,
} = await import('./telemetry-wiring')

describe('telemetry-wiring equality helpers', () => {
	const usageA = { input: 1, output: 2, cacheRead: 3, cacheWrite: 4, totalTokens: 10 }
	const usageB = { input: 1, output: 2, cacheRead: 3, cacheWrite: 4, totalTokens: 10 }
	const usageC = { input: 1, output: 2, cacheRead: 3, cacheWrite: 4, totalTokens: 11 }

	test('usageEquals returns false when a is undefined', () => {
		expect(usageEquals(undefined, usageA)).toBe(false)
	})

	test('usageEquals returns true for identical snapshots', () => {
		expect(usageEquals(usageA, usageB)).toBe(true)
	})

	test('usageEquals returns false when totalTokens differs', () => {
		expect(usageEquals(usageA, usageC)).toBe(false)
	})

	test('contextUsageEquals returns false when a is undefined', () => {
		expect(contextUsageEquals(undefined, { tokens: 1, contextWindow: 2, percent: 3 })).toBe(false)
	})

	test('contextUsageEquals returns true for identical snapshots', () => {
		expect(
			contextUsageEquals(
				{ tokens: 1, contextWindow: 2, percent: 3 },
				{ tokens: 1, contextWindow: 2, percent: 3 },
			),
		).toBe(true)
	})

	test('contextUsageEquals returns false on percent drift', () => {
		expect(
			contextUsageEquals(
				{ tokens: 1, contextWindow: 2, percent: 3 },
				{ tokens: 1, contextWindow: 2, percent: 4 },
			),
		).toBe(false)
	})

	test('modelsEqual returns false when a is undefined', () => {
		expect(modelsEqual(undefined, [])).toBe(false)
	})

	test('modelsEqual returns true for identical model lists', () => {
		const m = [
			{ provider: 'p', id: 'i', name: 'n', contextWindow: 1, maxTokens: 2 },
		]
		expect(modelsEqual(m, [...m])).toBe(true)
	})

	test('modelsEqual returns false on length mismatch', () => {
		const a = [{ provider: 'p', id: 'i', name: 'n', contextWindow: 1, maxTokens: 2 }]
		const b = [
			{ provider: 'p', id: 'i', name: 'n', contextWindow: 1, maxTokens: 2 },
			{ provider: 'p', id: 'i2', name: 'n', contextWindow: 1, maxTokens: 2 },
		]
		expect(modelsEqual(a, b)).toBe(false)
	})

	test('modelsEqual returns false on field drift', () => {
		const a = [{ provider: 'p', id: 'i', name: 'n', contextWindow: 1, maxTokens: 2 }]
		const b = [{ provider: 'p', id: 'i', name: 'n', contextWindow: 1, maxTokens: 3 }]
		expect(modelsEqual(a, b)).toBe(false)
	})
})

describe('telemetry-wiring.handleTelemetryEvent', () => {
	type FakeEntry = any
	let ctx: {
		rt: any
		entries: Map<string, FakeEntry>
		emittedStatuses: string[]
		persistCalls: Array<{ provider: string; name: string; contextWindow: number }>
	}

	beforeEach(() => {
		const entries = new Map<string, FakeEntry>()
		const emittedStatuses: string[] = []
		const persistCalls: Array<{ provider: string; name: string; contextWindow: number }> = []
		ctx = {
			entries,
			emittedStatuses,
			persistCalls,
			rt: {
				entries,
				emitStatus(agentId: string) {
					emittedStatuses.push(agentId)
				},
				emitEvent() {},
				usageEquals,
				contextUsageEquals,
				modelsEqual,
				persistModelContextWindow(provider: string, name: string, contextWindow: number) {
					persistCalls.push({ provider, name, contextWindow })
					return Promise.resolve()
				},
			},
		}
	})

	test('returns early when entry is missing', () => {
		handleTelemetryEvent(ctx.rt, 'nope', { type: 'usage', usage: { input: 1, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 1 } })
		expect(ctx.emittedStatuses.length).toBe(0)
	})

	test('usage event with new snapshot updates entry and emits status', () => {
		const entry: any = { usage: undefined }
		ctx.entries.set('a1', entry)
		handleTelemetryEvent(ctx.rt, 'a1', {
			type: 'usage',
			usage: { input: 5, output: 6, cacheRead: 0, cacheWrite: 0, totalTokens: 11 },
		})
		expect(entry.usage.totalTokens).toBe(11)
		expect(ctx.emittedStatuses).toContain('a1')
	})

	test('usage event with identical snapshot is a no-op', () => {
		const usage = { input: 5, output: 6, cacheRead: 0, cacheWrite: 0, totalTokens: 11 }
		const entry = { usage: { ...usage } }
		ctx.entries.set('a1', entry)
		ctx.emittedStatuses.length = 0
		handleTelemetryEvent(ctx.rt, 'a1', { type: 'usage', usage })
		expect(ctx.emittedStatuses.length).toBe(0)
	})

	test('context event with new snapshot updates entry and emits status', () => {
		const entry: any = { contextUsage: undefined }
		ctx.entries.set('a1', entry)
		handleTelemetryEvent(ctx.rt, 'a1', {
			type: 'context',
			tokens: 100,
			contextWindow: 8000,
			percent: 1.25,
		})
		expect(entry.contextUsage).toEqual({ tokens: 100, contextWindow: 8000, percent: 1.25 })
		expect(ctx.emittedStatuses).toContain('a1')
	})

	test('models event with new list updates entry and emits status', () => {
		const entry: any = { availableModels: undefined }
		ctx.entries.set('a1', entry)
		const models = [{ provider: 'p', id: 'i', name: 'n', contextWindow: 1, maxTokens: 2 }]
		handleTelemetryEvent(ctx.rt, 'a1', { type: 'models', models })
		expect(entry.availableModels).toEqual(models)
	})

	test('model event sets active model + persists context window', () => {
		const entry: any = { activeModelContextWindow: undefined, activeModelName: undefined, activeModelProvider: undefined }
		ctx.entries.set('a1', entry)
		handleTelemetryEvent(ctx.rt, 'a1', {
			type: 'model',
			provider: 'openai',
			name: 'gpt-4o',
			contextWindow: 128000,
		})
		expect(entry.activeModelProvider).toBe('openai')
		expect(entry.activeModelName).toBe('gpt-4o')
		expect(entry.activeModelContextWindow).toBe(128000)
		expect(ctx.persistCalls).toEqual([{ provider: 'openai', name: 'gpt-4o', contextWindow: 128000 }])
	})

	test('model event without contextWindow does not persist', () => {
		const entry: any = { activeModelContextWindow: undefined, activeModelName: undefined, activeModelProvider: undefined }
		ctx.entries.set('a1', entry)
		handleTelemetryEvent(ctx.rt, 'a1', {
			type: 'model',
			provider: 'openai',
			name: 'gpt-4o',
		})
		expect(ctx.persistCalls.length).toBe(0)
	})

	test('unknown event types are silently ignored', () => {
		const entry = { activeModelContextWindow: 1 }
		ctx.entries.set('a1', entry)
		handleTelemetryEvent(ctx.rt, 'a1', { type: 'lifecycle', event: 'x' })
		expect(ctx.emittedStatuses.length).toBe(0)
	})
})
