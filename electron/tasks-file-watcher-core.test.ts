/**
 * Tests for tasks-file-watcher-core (pure ingest logic).
 *
 * Seed data is written directly to db.*.json files (the cross-repo
 * mock leakage from the IPC test suite makes the real repositories
 * unreliable here). The tests exercise the ingestPlan/ingestComplete
 * functions against a known project/agent layout.
 *
 * Run: `bun test electron/tasks-file-watcher-core.test.ts`
 */

import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import { mkdirSync, rmSync, existsSync, writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { setUserDataPath, __resetDbCache } from '../src/storage/database'
import { __resetProjectDb } from '../src/storage/repositories/ProjectRepository'
import { __resetAgentDb } from '../src/storage/repositories/AgentRepository'
import { __resetTaskDb } from '../src/storage/repositories/TaskRepository'
import { ingestPlan, ingestComplete } from './tasks-file-watcher-core'
import type { Project, Agent, Task } from '../src/storage/types'

let sandbox: string
let projectDir: string
let coordDir: string
let aliceId: string
let bobId: string
let projectId: string

beforeEach(() => {
  // ponytail: lowdb's JSONFilePreset uses an in-memory adapter when
  // NODE_ENV === 'test'. Force the JSONFile adapter so the ingest
  // functions actually read our seed JSON.
  ;(process.env as any).NODE_ENV = 'development'
  sandbox = join(tmpdir(), `tasks-fw-core-${crypto.randomUUID()}`)
  mkdirSync(sandbox, { recursive: true })
  setUserDataPath(sandbox)
  __resetDbCache()
  __resetProjectDb()
  __resetAgentDb()
  __resetTaskDb()
  projectDir = join(sandbox, 'projects', 'p1')
  coordDir = join(projectDir, 'agent')
  mkdirSync(coordDir, { recursive: true })

  aliceId = crypto.randomUUID()
  bobId = crypto.randomUUID()
  projectId = crypto.randomUUID()

  const project: Project = {
    id: projectId,
    name: 'P1',
    description: 'seeded',
    archived: false,
    agentIds: [aliceId, bobId],
    taskIds: [],
    childProjectIds: [],
    localPath: projectDir,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  const alice: Agent = {
    id: aliceId,
    name: 'Alice',
    role: 'worker',
    description: 'seeded',
    status: 'idle',
    projectIds: [projectId],
    taskIds: [],
    sessionIds: [],
    agentKind: 'standard',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  const bob: Agent = {
    id: bobId,
    name: 'Bob',
    role: 'worker',
    description: 'seeded',
    status: 'idle',
    projectIds: [projectId],
    taskIds: [],
    sessionIds: [],
    agentKind: 'standard',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  writeFileSync(join(sandbox, 'db.projects.json'), JSON.stringify([project]))
  writeFileSync(join(sandbox, 'db.agents.json'), JSON.stringify([alice, bob]))
  writeFileSync(join(sandbox, 'db.tasks.json'), JSON.stringify([]))
})

afterEach(() => {
  ;(process.env as any).NODE_ENV = 'test'
  if (existsSync(sandbox)) rmSync(sandbox, { recursive: true, force: true })
})

function readTasks(): Task[] {
  return JSON.parse(readFileSync(join(sandbox, 'db.tasks.json'), 'utf-8')) as Task[]
}

describe('ingestPlan', () => {
  test('creates tasks for each entry and assigns to the right agent', async () => {
    writeFileSync(
      join(coordDir, 'tasks-plan.json'),
      JSON.stringify({
        tasks: [
          { title: 'A', description: 'do A', assignedAgent: 'Alice' },
          { title: 'B', description: 'do B', assignedAgent: 'Bob', dependencies: ['A'] },
        ],
      }),
    )
    const { created } = await ingestPlan(coordDir)
    expect(created).toBe(2)
    const tasks = readTasks()
    const a = tasks.find((t) => t.title === 'A')!
    const b = tasks.find((t) => t.title === 'B')!
    expect(a.assignedAgentId).toBe(aliceId)
    expect(b.assignedAgentId).toBe(bobId)
    expect(b.dependencies).toEqual([a.id])
  })

  test('truncates the plan file after ingestion', async () => {
    writeFileSync(join(coordDir, 'tasks-plan.json'), JSON.stringify({ tasks: [] }))
    await ingestPlan(coordDir)
    expect(readFileSync(join(coordDir, 'tasks-plan.json'), 'utf-8')).toBe('')
  })

  test('skips entries whose assignedAgent is not a project member', async () => {
    writeFileSync(
      join(coordDir, 'tasks-plan.json'),
      JSON.stringify({
        tasks: [
          { title: 'A', assignedAgent: 'Alice' },
          { title: 'X', assignedAgent: 'Nobody' },
        ],
      }),
    )
    const { created } = await ingestPlan(coordDir)
    expect(created).toBe(1)
    const tasks = readTasks()
    expect(tasks).toHaveLength(1)
    expect(tasks[0]!.title).toBe('A')
  })

  test('skips when plan is empty object', async () => {
    writeFileSync(join(coordDir, 'tasks-plan.json'), '{}')
    const { created } = await ingestPlan(coordDir)
    expect(created).toBe(0)
  })

  test('skips when plan file is empty string', async () => {
    writeFileSync(join(coordDir, 'tasks-plan.json'), '')
    const { created } = await ingestPlan(coordDir)
    expect(created).toBe(0)
  })

  test('skips malformed JSON', async () => {
    writeFileSync(join(coordDir, 'tasks-plan.json'), '{not valid json')
    const { created } = await ingestPlan(coordDir)
    expect(created).toBe(0)
  })
})

describe('ingestComplete', () => {
  test('marks each task completed with the summary as outcome', async () => {
    const t1: Task = {
      id: crypto.randomUUID(),
      title: 'T1',
      projectId,
      status: 'running',
      priority: 'medium',
      tagIds: [],
      dependencies: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    const t2: Task = {
      id: crypto.randomUUID(),
      title: 'T2',
      projectId,
      status: 'running',
      priority: 'medium',
      tagIds: [],
      dependencies: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    writeFileSync(join(sandbox, 'db.tasks.json'), JSON.stringify([t1, t2]))
    writeFileSync(
      join(coordDir, 'tasks-complete.jsonl'),
      [
        JSON.stringify({ taskId: t1.id, summary: 'first done', ts: Date.now() }),
        JSON.stringify({ taskId: t2.id, summary: 'second done', ts: Date.now() }),
      ].join('\n') + '\n',
    )
    const { applied } = await ingestComplete(coordDir)
    expect(applied).toBe(2)
    const tasks = readTasks()
    const reloaded1 = tasks.find((t) => t.id === t1.id)!
    const reloaded2 = tasks.find((t) => t.id === t2.id)!
    expect(reloaded1.status).toBe('completed')
    expect(reloaded1.outcome).toBe('first done')
    expect(reloaded2.status).toBe('completed')
    expect(reloaded2.outcome).toBe('second done')
  })

  test('truncates the complete file after ingestion', async () => {
    const t1: Task = {
      id: crypto.randomUUID(),
      title: 'T1',
      projectId,
      status: 'running',
      priority: 'medium',
      tagIds: [],
      dependencies: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    writeFileSync(join(sandbox, 'db.tasks.json'), JSON.stringify([t1]))
    writeFileSync(join(coordDir, 'tasks-complete.jsonl'), JSON.stringify({ taskId: t1.id, ts: Date.now() }) + '\n')
    await ingestComplete(coordDir)
    expect(readFileSync(join(coordDir, 'tasks-complete.jsonl'), 'utf-8')).toBe('')
  })

  test('skips malformed JSON lines', async () => {
    const t1: Task = {
      id: crypto.randomUUID(),
      title: 'T1',
      projectId,
      status: 'running',
      priority: 'medium',
      tagIds: [],
      dependencies: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    writeFileSync(join(sandbox, 'db.tasks.json'), JSON.stringify([t1]))
    writeFileSync(
      join(coordDir, 'tasks-complete.jsonl'),
      'not json\n' + JSON.stringify({ taskId: t1.id, ts: Date.now() }) + '\n',
    )
    const { applied } = await ingestComplete(coordDir)
    expect(applied).toBe(1)
  })
})
