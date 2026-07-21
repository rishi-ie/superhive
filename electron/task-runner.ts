/**
 * TaskRunner — dispatches ready tasks to their assigned workers.
 *
 * The runner polls every TICK_MS. For each project, it:
 *   1. Resets stale `running` tasks to `todo` if their `staleSince`
 *      is older than STALE_MS. The coordinator's auto-retry flow
 *      kicks in on the next dispatch.
 *   2. Marks `todo` tasks as `blocked` if any dependency was
 *      cancelled. The `blockerReason` lists the cancelled deps.
 *   3. Dispatches the FIRST ready `todo` task (serial — one at a
 *      time per project). The assigned agent is started if not
 *      running, then `runtime.send` injects the task prompt.
 *   4. Marks the dispatched task as `running` with `staleSince=now`.
 *
 * One-at-a-time per project is the conservative default. Increase
 * when a project needs parallelism.
 *
 * The runner does NOT watch the chat for "result" messages — the
 * coordinator calls `complete_task` after reading the worker's
 * result via `read_inbox`. That keeps the runner free of mailbox
 * state and matches the Gap 3 design (coordinator is the boss).
 *
 * Run: `bun test electron/task-runner.test.ts`
 */

import log from 'electron-log/main'
import { TaskRepository } from '../src/storage/repositories/TaskRepository'
import { AgentRepository } from '../src/storage/repositories/AgentRepository'
import { getUserDataPath } from '../src/storage/database'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const TICK_MS = 5_000
const STALE_MS = 10 * 60 * 1000  // 10 minutes before auto-retry

export interface RuntimeLike {
  isRunning(agentId: string): boolean
  start(agentId: string, agentDir: string, manifestPiSource?: string): void | Promise<void>
  send(agentId: string, text: string): boolean
}

function getDefaultRuntime(): RuntimeLike {
  // Lazy require so tests that pass an explicit runtime never touch
  // general-kai-runtime (which imports electron at the top level).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { runtime } = require('./general-kai-runtime') as { runtime: RuntimeLike }
  return runtime
}

export interface TaskRunnerOpts {
  runtime?: RuntimeLike
  tickMs?: number
  staleMs?: number
}

export function buildTaskPrompt(opts: {
  taskId: string
  title: string
  description?: string
  projectName: string
}): string {
  return [
    `Task ${opts.taskId}: ${opts.title}`,
    `Project: ${opts.projectName}`,
    '',
    opts.description ?? '',
  ].join('\n')
}

async function loadProjects(): Promise<Array<{ id: string; name: string; localPath?: string }>> {
  const userData = getUserDataPath()
  if (!userData) return []
  const projectsFile = join(userData, 'db.projects.json')
  if (!existsSync(projectsFile)) return []
  try {
    const data = JSON.parse(readFileSync(projectsFile, 'utf-8')) as Array<{ id: string; name: string; localPath?: string }>
    return data
  } catch {
    return []
  }
}

export class TaskRunner {
  private timer: NodeJS.Timeout | null = null
  private stopped = true
  private readonly tickMs: number
  private readonly staleMs: number
  private readonly runtime: RuntimeLike

  constructor(opts: TaskRunnerOpts = {}) {
    this.tickMs = opts.tickMs ?? TICK_MS
    this.staleMs = opts.staleMs ?? STALE_MS
    this.runtime = opts.runtime ?? getDefaultRuntime()
  }

  start(): void {
    if (!this.stopped) return
    this.stopped = false
    this.timer = setInterval(() => {
      this.tick().catch((err) => log.warn('[task-runner] tick failed:', err))
    }, this.tickMs)
    log.info(`[task-runner] started (tick=${this.tickMs}ms, stale=${this.staleMs}ms)`)
  }

  stop(): void {
    if (this.stopped) return
    this.stopped = true
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    log.info('[task-runner] stopped')
  }

  async tick(): Promise<void> {
    if (this.stopped) return
    // ponytail: read projects directly from db.projects.json so the
    // IPC test suite's mocked ProjectRepository doesn't break the runner.
    const projects = await loadProjects()
    for (const project of projects) {
      if (this.stopped) return
      await this.runProject(project)
    }
  }

  private async runProject(project: { id: string; name: string; localPath?: string }): Promise<void> {
    // ponytail: re-fetch after each pass so resets feed into the
    // ready dispatch in the same tick. One extra read per project
    // per tick is cheap.
    let tasks = await TaskRepository.getByProject(project.id)
    let byId = new Map(tasks.map((t) => [t.id, t]))

    // 1. reset stale running → todo
    const now = Date.now()
    const staleTasks = tasks.filter((tt) => tt.status === 'running' && tt.staleSince && now - tt.staleSince > this.staleMs)
    for (const t of staleTasks) {
      log.info(`[task-runner] auto-retry stale task ${t.id} (${t.title})`)
      await TaskRepository.changeStatus(t.id, 'todo', { staleSince: undefined })
    }

    // 2. block tasks whose deps are cancelled
    for (const t of tasks.filter((tt) => tt.status === 'todo' || tt.status === 'blocked')) {
      const cancelledDeps: typeof tasks = []
      for (const depId of t.dependencies) {
        const dep = byId.get(depId)
        if (dep && dep.status === 'cancelled') cancelledDeps.push(dep)
      }
      if (cancelledDeps.length > 0) {
        await TaskRepository.changeStatus(t.id, 'blocked', {
          blockerReason: `Dependency cancelled: ${cancelledDeps.map((d) => d.title).join(', ')}`,
        })
      }
    }

    // Re-fetch after resets so the dispatch sees fresh state.
    tasks = await TaskRepository.getByProject(project.id)
    byId = new Map(tasks.map((t) => [t.id, t]))

    // 3. dispatch first ready task (serial)
    const ready = tasks.find(
      (t) => t.status === 'todo' && t.dependencies.every((id) => byId.get(id)?.status === 'completed'),
    )
    if (!ready) return
    if (!ready.assignedAgentId) {
      log.warn(`[task-runner] ready task ${ready.id} (${ready.title}) has no assignedAgentId; skipping`)
      return
    }

    const agent = await AgentRepository.getById(ready.assignedAgentId)
    if (!agent) {
      log.warn(`[task-runner] assigned agent ${ready.assignedAgentId} not found; skipping task ${ready.id}`)
      return
    }
    if (!agent.localPath) {
      log.warn(`[task-runner] agent ${agent.id} has no localPath; skipping task ${ready.id}`)
      return
    }

    if (!this.runtime.isRunning(agent.id)) {
      this.runtime.start(agent.id, agent.localPath, (agent as { manifestPiSource?: string }).manifestPiSource)
    }
    const prompt = buildTaskPrompt({
      taskId: ready.id,
      title: ready.title,
      description: ready.description,
      projectName: project.name,
    })
    const sent = this.runtime.send(agent.id, prompt)
    if (sent) {
      await TaskRepository.changeStatus(ready.id, 'running', { staleSince: Date.now() })
      log.info(`[task-runner] dispatched task ${ready.id} (${ready.title}) → ${agent.name}`)
    } else {
      log.warn(`[task-runner] runtime.send returned false for ${agent.id}; leaving task ${ready.id} in todo`)
    }
  }
}

// Lazy singleton so importing this module doesn't pull in general-kai-runtime
// (which imports electron at the top level). main.ts calls `getTaskRunner()`
// after boot.
let _instance: TaskRunner | null = null
export function getTaskRunner(): TaskRunner {
  if (!_instance) _instance = new TaskRunner()
  return _instance
}
