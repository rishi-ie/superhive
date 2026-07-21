import { loadDb } from '../database'
import type { Task, TaskStatus, Project, Agent } from '../types'

let _db: Awaited<ReturnType<typeof loadDb<Task[]>>> | null = null

async function getDb() {
  if (!_db) _db = await loadDb<Task[]>('db.tasks.json', [])
  return _db
}

export function __resetTaskDb(): void {
  _db = null
}

export const TaskRepository = {
  async create(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'priority' | 'tagIds' | 'dependencies'>): Promise<Task> {
    const db = await getDb()
    const now = Date.now()
    const task: Task = {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      projectId: data.projectId,
      assignedAgentId: data.assignedAgentId,
      context: data.context,
      status: 'todo',
      priority: 'medium',
      tagIds: [],
      dependencies: [],
      staleSince: data.staleSince,
      outcome: data.outcome,
      blockerReason: data.blockerReason,
      createdAt: now,
      updatedAt: now,
    }
    db.data.push(task)

    const projectDb = await loadDb<Project[]>('db.projects.json', [])
    const project = projectDb.data.find((p: Project) => p.id === data.projectId)
    if (project && !project.taskIds.includes(task.id)) {
      project.taskIds.push(task.id)
      project.updatedAt = now
      await projectDb.write()
    }

    if (task.assignedAgentId) {
      const agentDb = await loadDb<Agent[]>('db.agents.json', [])
      const agent = agentDb.data.find((a: Agent) => a.id === task.assignedAgentId)
      if (agent && !agent.taskIds.includes(task.id)) {
        agent.taskIds.push(task.id)
        agent.updatedAt = now
        await agentDb.write()
      }
    }

    await db.write()
    return task
  },

  async getById(id: string): Promise<Task | undefined> {
    const db = await getDb()
    return db.data.find((t: Task) => t.id === id)
  },

  async getAll(): Promise<Task[]> {
    const db = await getDb()
    return db.data
  },

  async getByProject(projectId: string): Promise<Task[]> {
    const db = await getDb()
    return db.data.filter((t: Task) => t.projectId === projectId)
  },

  async getByAgent(agentId: string): Promise<Task[]> {
    const db = await getDb()
    return db.data.filter((t: Task) => t.assignedAgentId === agentId)
  },

  async update(id: string, data: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task | undefined> {
    const db = await getDb()
    const idx = db.data.findIndex((t: Task) => t.id === id)
    if (idx === -1) return undefined
    const existing = db.data[idx]
    const updated = { ...existing, ...data, updatedAt: Date.now() } as Task
    db.data[idx] = updated
    await db.write()
    return updated
  },

  async delete(id: string): Promise<boolean> {
    const db = await getDb()
    const len = db.data.length
    db.data = db.data.filter((t: Task) => t.id !== id)
    if (db.data.length === len) return false

    const projectDb = await loadDb<Project[]>('db.projects.json', [])
    projectDb.data.forEach((p: Project) => {
      p.taskIds = p.taskIds.filter((tid: string) => tid !== id)
    })
    await projectDb.write()

    const agentDb = await loadDb<Agent[]>('db.agents.json', [])
    agentDb.data.forEach((a: Agent) => {
      a.taskIds = a.taskIds.filter((tid: string) => tid !== id)
    })
    await agentDb.write()

    await db.write()
    return true
  },

  async assignAgent(taskId: string, agentId: string | undefined): Promise<void> {
    const db = await getDb()
    const task = db.data.find((t: Task) => t.id === taskId)
    if (!task) return

    const previousAgentId = task.assignedAgentId

    if (previousAgentId && previousAgentId !== agentId) {
      const agentDb = await loadDb<Agent[]>('db.agents.json', [])
      const prev = agentDb.data.find((a: Agent) => a.id === previousAgentId)
      if (prev) {
        prev.taskIds = prev.taskIds.filter((tid: string) => tid !== taskId)
        prev.updatedAt = Date.now()
        await agentDb.write()
      }
    }

    task.assignedAgentId = agentId
    task.updatedAt = Date.now()
    await db.write()

    if (agentId) {
      const agentDb = await loadDb<Agent[]>('db.agents.json', [])
      const next = agentDb.data.find((a: Agent) => a.id === agentId)
      if (next && !next.taskIds.includes(taskId)) {
        next.taskIds.push(taskId)
        next.updatedAt = Date.now()
        await agentDb.write()
      }
    }
  },

  async changeStatus(
    taskId: string,
    status: TaskStatus,
    opts?: { blockerReason?: string; staleSince?: number | null; outcome?: string },
  ): Promise<Task | undefined> {
    const patch: Partial<Task> = { status }
    if (status === 'blocked') {
      patch.blockerReason = opts?.blockerReason
    } else if (status === 'todo' || status === 'running') {
      patch.blockerReason = undefined
    }
    if (status === 'completed') {
      patch.outcome = opts?.outcome
      patch.staleSince = undefined
    }
    // ponytail: staleSince handling. Callers can:
    //   - omit opts.staleSince       → leave the field as-is
    //   - pass opts.staleSince=null  → clear the field (set to undefined)
    //   - pass opts.staleSince=number→ set to that number
    if (opts && 'staleSince' in opts) {
      patch.staleSince = opts.staleSince === null ? undefined : opts.staleSince
    }
    return this.update(taskId, patch)
  },

  async getStaleRunning(staleAfterMs: number): Promise<Task[]> {
    const db = await getDb()
    const cutoff = Date.now() - staleAfterMs
    return db.data.filter(
      (t: Task) => t.status === 'running' && t.staleSince !== undefined && t.staleSince < cutoff,
    )
  },
}
