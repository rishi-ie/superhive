/**
 * Unit tests for `runtime/settings-watcher.ts`.
 *
 * Exercises `markSelfWrite`, `closeSettingsWatcher`,
 * `closeAllSettingsWatchers` against a fake `rt`. `ensureSettingsWatcher`
 * requires a real `BrowserWindow` and `node:fs.watch`, so we mock
 * `node:fs` and `../ipc/index` to validate the watcher-setup path
 * without touching the disk or Electron.
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

mock.module('../ipc/index', () => ({
	IPC: {
		AGENTS: {
			ON_SETTINGS_CHANGED: (id: string) => `agent:${id}:settings-changed`,
		},
	},
}))

const watcherInstances: Array<{ closed: boolean; eventHandlers: Map<string, Function> }> = []

mock.module('node:fs', () => {
	const actual = require('node:fs')
	return {
		...actual,
		watch: (_path: string, _cb: (eventType: string) => void) => {
			const instance = { closed: false, eventHandlers: new Map<string, Function>() }
			watcherInstances.push(instance)
			return {
				on: (event: string, handler: Function) => {
					instance.eventHandlers.set(event, handler)
				},
				close: () => {
					instance.closed = true
				},
			}
		},
	}
})

const { ensureSettingsWatcher, closeSettingsWatcher, closeAllSettingsWatchers, markSelfWrite } =
	await import('./settings-watcher')

function makeRt() {
	const settingsWatchers = new Map<string, any>()
	const lastSeenCounter = new Map<string, number>()
	let windowOpen = true

	const rt: any = {
		settingsWatchers,
		lastSeenCounter,
		getWindow() {
			return windowOpen
				? {
						isDestroyed: () => false,
						webContents: { send: () => {} },
					}
				: null
		},
	}

	return { rt, settingsWatchers, lastSeenCounter, setWindowOpen: (v: boolean) => (windowOpen = v) }
}

describe('settings-watcher.markSelfWrite', () => {
	let ctx: ReturnType<typeof makeRt>
	beforeEach(() => {
		ctx = makeRt()
	})

	test('records the counter in lastSeenCounter', () => {
		markSelfWrite(ctx.rt, 'a1', 7)
		expect(ctx.lastSeenCounter.get('a1')).toBe(7)
	})

	test('overwrites a previously recorded counter', () => {
		markSelfWrite(ctx.rt, 'a1', 7)
		markSelfWrite(ctx.rt, 'a1', 12)
		expect(ctx.lastSeenCounter.get('a1')).toBe(12)
	})
})

describe('settings-watcher.ensureSettingsWatcher', () => {
	let ctx: ReturnType<typeof makeRt>
	beforeEach(() => {
		ctx = makeRt()
		watcherInstances.length = 0
	})

	test('first call creates a watcher; second call is a no-op', () => {
		ensureSettingsWatcher(ctx.rt, 'a1', '/tmp/a1.json')
		expect(ctx.settingsWatchers.size).toBe(1)
		expect(watcherInstances.length).toBe(1)

		ensureSettingsWatcher(ctx.rt, 'a1', '/tmp/a1.json')
		expect(ctx.settingsWatchers.size).toBe(1)
		expect(watcherInstances.length).toBe(1)
	})

	test('no-op when window is unavailable', () => {
		ctx.setWindowOpen(false)
		ensureSettingsWatcher(ctx.rt, 'a1', '/tmp/a1.json')
		expect(ctx.settingsWatchers.size).toBe(0)
		expect(watcherInstances.length).toBe(0)
	})
})

describe('settings-watcher.closeSettingsWatcher', () => {
	let ctx: ReturnType<typeof makeRt>
	beforeEach(() => {
		ctx = makeRt()
		watcherInstances.length = 0
	})

	test('no-op when no watcher exists for the agent', () => {
		closeSettingsWatcher(ctx.rt, 'a1')
		expect(ctx.settingsWatchers.size).toBe(0)
	})

	test('closes the underlying watcher and removes it from the map', () => {
		ensureSettingsWatcher(ctx.rt, 'a1', '/tmp/a1.json')
		const watcher = watcherInstances[0]!
		expect(ctx.settingsWatchers.has('a1')).toBe(true)

		closeSettingsWatcher(ctx.rt, 'a1')

		expect(watcher.closed).toBe(true)
		expect(ctx.settingsWatchers.has('a1')).toBe(false)
	})
})

describe('settings-watcher.closeAllSettingsWatchers', () => {
	let ctx: ReturnType<typeof makeRt>
	beforeEach(() => {
		ctx = makeRt()
		watcherInstances.length = 0
	})

	test('closes every watcher', () => {
		ensureSettingsWatcher(ctx.rt, 'a1', '/tmp/a1.json')
		ensureSettingsWatcher(ctx.rt, 'a2', '/tmp/a2.json')
		ensureSettingsWatcher(ctx.rt, 'a3', '/tmp/a3.json')

		closeAllSettingsWatchers(ctx.rt)

		expect(ctx.settingsWatchers.size).toBe(0)
		for (const w of watcherInstances) expect(w.closed).toBe(true)
	})

	test('no-op when no watchers exist', () => {
		closeAllSettingsWatchers(ctx.rt)
		expect(ctx.settingsWatchers.size).toBe(0)
	})
})
