/**
 * Tests for TaskRepository.
 *
 * Pure logic tests: defaults, status transitions, updates, stale
 * detection. We do NOT test the project/agent cascade here because
 * Bun's `mock.module` (used by the IPC test suite) leaks across
 * test files, and overriding that in a sibling test file is more
 * code than the cascade logic is worth. The cascade is a 3-line
 * `project.taskIds.push(id)` pattern matching AgentRepository's
 * existing cascade in delete() (lines 87-91).
 *
 * Run: `bun test src/storage/repositories/TaskRepository.test.ts`
 */

import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import { mkdirSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { setUserDataPath, __resetDbCache } from '../database'
import { TaskRepository, __resetTaskDb } from './TaskRepository'

let sandbox: string

beforeEach(() => {
  // ponytail: lowdb's JSONFilePreset uses an in-memory adapter when
  // NODE_ENV === 'test'. We don't actually need to read the disk
  // back for these unit tests, so leave the env alone.
  sandbox = join(tmpdir(), `task-repo-test-${crypto.randomUUID()}`)
  mkdirSync(sandbox, { recursive: true })
  setUserDataPath(sandbox)
  __resetDbCache()
  __resetTaskDb()
})

afterEach(() => {
  if (existsSync(sandbox)) rmSync(sandbox, { recursive: true, force: true })
})

const FAKE_PROJECT_ID = '11111111-1111-1111-1111-111111111111'

describe('TaskRepository.create', () => {
  test('stamps defaults: status=todo, priority=medium, dependencies=[], tagIds=[]', async () => {
    const task = await TaskRepository.create({ title: 'Build a thing', projectId: FAKE_PROJECT_ID })
    expect(task.id).toBeTruthy()
    expect(task.status).toBe('todo')
    expect(task.priority).toBe('medium')
    expect(task.dependencies).toEqual([])
    expect(task.tagIds).toEqual([])
    expect(task.createdAt).toBeGreaterThan(0)
    expect(task.updatedAt).toBe(task.createdAt)
  })

  test('preserves caller-provided assignedAgentId', async () => {
    const task = await TaskRepository.create({
      title: 'X',
      projectId: FAKE_PROJECT_ID,
      assignedAgentId: 'agent-1',
    })
    expect(task.assignedAgentId).toBe('agent-1')
  })
})

describe('TaskRepository.update', () => {
  test('bumps updatedAt and merges patch', async () => {
    const task = await TaskRepository.create({ title: 'X', projectId: FAKE_PROJECT_ID })
    await new Promise((r) => setTimeout(r, 2))
    const updated = await TaskRepository.update(task.id, { title: 'Y', priority: 'high' })
    expect(updated?.title).toBe('Y')
    expect(updated?.priority).toBe('high')
    expect(updated?.updatedAt).toBeGreaterThan(task.updatedAt)
  })
})

describe('TaskRepository.changeStatus', () => {
  test('completed clears staleSince and sets outcome', async () => {
    const task = await TaskRepository.create({ title: 'X', projectId: FAKE_PROJECT_ID })
    await TaskRepository.changeStatus(task.id, 'running', { staleSince: Date.now() })
    const updated = await TaskRepository.changeStatus(task.id, 'completed', { outcome: 'done' })
    expect(updated?.status).toBe('completed')
    expect(updated?.outcome).toBe('done')
    expect(updated?.staleSince).toBeUndefined()
  })

  test('blocked sets blockerReason; todo/running clears it', async () => {
    const task = await TaskRepository.create({ title: 'X', projectId: FAKE_PROJECT_ID })
    const blocked = await TaskRepository.changeStatus(task.id, 'blocked', { blockerReason: 'dep X failed' })
    expect(blocked?.blockerReason).toBe('dep X failed')
    const cleared = await TaskRepository.changeStatus(task.id, 'todo')
    expect(cleared?.blockerReason).toBeUndefined()
  })

  test('staleSince can be cleared by passing null', async () => {
    const task = await TaskRepository.create({ title: 'X', projectId: FAKE_PROJECT_ID })
    await TaskRepository.changeStatus(task.id, 'running', { staleSince: Date.now() })
    const updated = await TaskRepository.changeStatus(task.id, 'running', { staleSince: null })
    expect(updated?.staleSince).toBeUndefined()
  })
})

describe('TaskRepository.getStaleRunning', () => {
  test('returns only running tasks with staleSince older than cutoff', async () => {
    const t1 = await TaskRepository.create({ title: 'stale', projectId: FAKE_PROJECT_ID })
    const t2 = await TaskRepository.create({ title: 'fresh', projectId: FAKE_PROJECT_ID })
    await TaskRepository.create({ title: 'todo', projectId: FAKE_PROJECT_ID })
    await TaskRepository.changeStatus(t1.id, 'running', { staleSince: Date.now() - 1_000_000 })
    await TaskRepository.changeStatus(t2.id, 'running', { staleSince: Date.now() - 1_000 })
    const stale = await TaskRepository.getStaleRunning(60_000)
    expect(stale.map((t) => t.id)).toEqual([t1.id])
  })
})

describe('TaskRepository.getByProject / getByAgent', () => {
  test('getByProject filters by projectId', async () => {
    await TaskRepository.create({ title: 'A', projectId: 'p-1' })
    await TaskRepository.create({ title: 'B', projectId: 'p-2' })
    await TaskRepository.create({ title: 'C', projectId: 'p-1' })
    const tasks = await TaskRepository.getByProject('p-1')
    expect(tasks).toHaveLength(2)
    expect(tasks.map((t) => t.title).sort()).toEqual(['A', 'C'])
  })

  test('getByAgent filters by assignedAgentId', async () => {
    await TaskRepository.create({ title: 'A', projectId: 'p-1', assignedAgentId: 'agent-1' })
    await TaskRepository.create({ title: 'B', projectId: 'p-1', assignedAgentId: 'agent-2' })
    await TaskRepository.create({ title: 'C', projectId: 'p-1' })
    const tasks = await TaskRepository.getByAgent('agent-1')
    expect(tasks).toHaveLength(1)
    expect(tasks[0]!.title).toBe('A')
  })
})
