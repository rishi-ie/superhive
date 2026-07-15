/**
 * Tests for the pure `revealInFinder` helper.
 *
 * Pins the contract: the caller passes an opaque `agentId`. The helper
 * resolves the local path strictly from `AgentRepository.getById`,
 * validates the folder still exists, and hands it to
 * `shell.showItemInFolder`. No raw paths cross the trust boundary.
 *
 * The IPC handler in `agents.ts` is a one-line wrapper, so the helper
 * test covers the contract.
 *
 * Run via `bun test electron/ipc/reveal-in-finder.test.ts`.
 */

import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const tmp = join(tmpdir(), `reveal-${Date.now()}-${Math.random().toString(36).slice(2)}`)
mkdirSync(tmp, { recursive: true })

const showItemCalls: string[] = []
let lookup: (id: string) => unknown = () => undefined

mock.module('electron', () => ({
	shell: {
		showItemInFolder: (path: string) => {
			showItemCalls.push(path)
		},
	},
}))

mock.module('../../src/storage/repositories/AgentRepository', () => ({
	AgentRepository: {
		getById: (id: string) => lookup(id),
	},
}))

const { revealInFinder } = await import('./reveal-in-finder')

afterEach(() => {
	if (existsSync(tmp)) {
		rmSync(tmp, { recursive: true, force: true })
	}
	mkdirSync(tmp, { recursive: true })
	showItemCalls.length = 0
	lookup = () => undefined
})

beforeEach(() => {
	showItemCalls.length = 0
	lookup = () => undefined
})

describe('revealInFinder', () => {
	test('throws when agentId is missing', async () => {
		await expect(revealInFinder('')).rejects.toThrow('Agent id is required')
		expect(showItemCalls).toEqual([])
	})

	test('throws when agent is not found', async () => {
		lookup = () => undefined
		await expect(revealInFinder('missing')).rejects.toThrow('Agent not found or has no folder')
		expect(showItemCalls).toEqual([])
	})

	test('throws when agent has no localPath', async () => {
		lookup = () => ({ id: 'a1' })
		await expect(revealInFinder('a1')).rejects.toThrow('Agent not found or has no folder')
		expect(showItemCalls).toEqual([])
	})

	test('throws when the folder no longer exists on disk', async () => {
		lookup = () => ({ id: 'a1', localPath: '/definitely/does/not/exist/agent-a1' })
		await expect(revealInFinder('a1')).rejects.toThrow('Agent folder no longer exists')
		expect(showItemCalls).toEqual([])
	})

	test('reaches shell.showItemInFolder with the trusted localPath', async () => {
		const agentDir = join(tmp, 'agent-a1')
		mkdirSync(agentDir, { recursive: true })
		lookup = () => ({ id: 'a1', localPath: agentDir })

		const result = await revealInFinder('a1')
		expect(result).toEqual({ ok: true })
		expect(showItemCalls).toEqual([agentDir])
	})
})
