import { loadDb } from '../database'
import type { Task, TaskStatus, TaskPriority, Project, Agent } from '../types'

let _db: Awaited<ReturnType<typeof loadDb<Task[]>>> | null = null

async function getDb() {
  if (!_db) _db = await loadDb<Task[]>('db.tasks.json', [])
  return _db
}

export const TaskRepository = {
  async create(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'tagIds' | 'status' | 'priority'>): Promise<Task> {
    const db = await getDb()
    const now = Date.now()
    const task: Task = {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      projectId: data.projectId,
      assignedAgentId: data.assignedAgentId,
      status: 'todo',
      priority: 'medium',
      context: data.context,
      tagIds: [],
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

  async update(id: string, data: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Task | undefined> {
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
    const task = db.data.find((t: Task) => t.id === id)
    if (!task) return false

    db.data = db.data.filter((t: Task) => t.id !== id)

    const projectDb = await loadDb<Project[]>('db.projects.json', [])
    const project = projectDb.data.find((p: Project) => p.id === task.projectId)
    if (project) {
      project.taskIds = project.taskIds.filter((tid: string) => tid !== id)
      await projectDb.write()
    }

    if (task.assignedAgentId) {
      const agentDb = await loadDb<Agent[]>('db.agents.json', [])
      const agent = agentDb.data.find((a: Agent) => a.id === task.assignedAgentId)
      if (agent) {
        agent.taskIds = agent.taskIds.filter((tid: string) => tid !== id)
        await agentDb.write()
      }
    }

    await db.write()
    return true
  },

  async assignAgent(taskId: string, agentId: string): Promise<void> {
    const db = await getDb()
    const agentDb = await loadDb<Agent[]>('db.agents.json', [])
    const task = db.data.find((t: Task) => t.id === taskId)
    const agent = agentDb.data.find((a: Agent) => a.id === agentId)
    if (!task || !agent) return

    if (task.assignedAgentId && task.assignedAgentId !== agentId) {
      const prevAgent = agentDb.data.find((a: Agent) => a.id === task.assignedAgentId)
      if (prevAgent) {
        prevAgent.taskIds = prevAgent.taskIds.filter((tid: string) => tid !== taskId)
      }
    }

    task.assignedAgentId = agentId
    task.updatedAt = Date.now()

    if (!agent.taskIds.includes(taskId)) {
      agent.taskIds.push(taskId)
      agent.updatedAt = Date.now()
    }

    await db.write()
    await agentDb.write()
  },

  async unassignAgent(taskId: string): Promise<void> {
    const db = await getDb()
    const agentDb = await loadDb<Agent[]>('db.agents.json', [])
    const task = db.data.find((t: Task) => t.id === taskId)
    if (!task) return

    if (task.assignedAgentId) {
      const agent = agentDb.data.find((a: Agent) => a.id === task.assignedAgentId)
      if (agent) {
        agent.taskIds = agent.taskIds.filter((tid: string) => tid !== taskId)
        agent.updatedAt = Date.now()
        await agentDb.write()
      }
    }

    task.assignedAgentId = undefined
    task.updatedAt = Date.now()
    await db.write()
  },

  async changeStatus(taskId: string, status: TaskStatus): Promise<Task | undefined> {
    return this.update(taskId, { status })
  },

  async changePriority(taskId: string, priority: TaskPriority): Promise<Task | undefined> {
    return this.update(taskId, { priority })
  },

  async addTag(taskId: string, tagId: string): Promise<void> {
    const db = await getDb()
    const task = db.data.find((t: Task) => t.id === taskId)
    if (task && !task.tagIds.includes(tagId)) {
      task.tagIds.push(tagId)
      task.updatedAt = Date.now()
      await db.write()
    }
  },

  async removeTag(taskId: string, tagId: string): Promise<void> {
    const db = await getDb()
    const task = db.data.find((t: Task) => t.id === taskId)
    if (task) {
      task.tagIds = task.tagIds.filter((tid: string) => tid !== tagId)
      task.updatedAt = Date.now()
      await db.write()
    }
  },
}
