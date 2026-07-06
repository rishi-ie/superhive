import { loadDb } from '../database'
import type { Agent, Project, Task, Session } from '../types'

let _db: Awaited<ReturnType<typeof loadDb<Agent[]>>> | null = null

async function getDb() {
  if (!_db) _db = await loadDb<Agent[]>('db.agents.json', [])
  return _db
}

export const AgentRepository = {
  async create(data: Omit<Agent, 'id' | 'createdAt' | 'updatedAt' | 'projectIds' | 'taskIds' | 'sessionIds'>): Promise<Agent> {
    const db = await getDb()
    const now = Date.now()
    const agent: Agent = {
      id: crypto.randomUUID(),
      name: data.name,
      role: data.role,
      description: data.description,
      localPath: data.localPath,
      manifestPiSource: data.manifestPiSource,
      avatar: data.avatar,
      status: data.status,
      lastError: data.lastError,
      projectIds: [],
      taskIds: [],
      sessionIds: [],
      createdAt: now,
      updatedAt: now,
    }
    db.data.push(agent)
    await db.write()
    return agent
  },

  async getById(id: string): Promise<Agent | undefined> {
    const db = await getDb()
    return db.data.find((a: Agent) => a.id === id)
  },

  async getAll(): Promise<Agent[]> {
    const db = await getDb()
    return db.data
  },

  async getByProject(projectId: string): Promise<Agent[]> {
    const db = await getDb()
    return db.data.filter((a: Agent) => a.projectIds.includes(projectId))
  },

  async update(id: string, data: Partial<Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Agent | undefined> {
    const db = await getDb()
    const idx = db.data.findIndex((a: Agent) => a.id === id)
    if (idx === -1) return undefined
    const existing = db.data[idx]
    const updated = { ...existing, ...data, updatedAt: Date.now() } as Agent
    db.data[idx] = updated
    await db.write()
    return updated
  },

  async delete(id: string): Promise<boolean> {
    const db = await getDb()
    const len = db.data.length
    db.data = db.data.filter((a: Agent) => a.id !== id)
    if (db.data.length === len) return false

    const projectDb = await loadDb<Project[]>('db.projects.json', [])
    projectDb.data.forEach((p: Project) => {
      p.agentIds = p.agentIds.filter((aid: string) => aid !== id)
    })
    await projectDb.write()

    const taskDb = await loadDb<Task[]>('db.tasks.json', [])
    taskDb.data.forEach((t: Task) => {
      if (t.assignedAgentId === id) t.assignedAgentId = undefined
    })
    await taskDb.write()

    const sessionDb = await loadDb<Session[]>('db.sessions.json', [])
    sessionDb.data = sessionDb.data.filter((s: Session) => s.agentId !== id)
    await sessionDb.write()

    await db.write()
    return true
  },

  async getProjects(agentId: string): Promise<Project[]> {
    const agent = await this.getById(agentId)
    if (!agent) return []
    const projectDb = await loadDb<Project[]>('db.projects.json', [])
    return projectDb.data.filter((p: Project) => agent.projectIds.includes(p.id))
  },

  async getTasks(agentId: string): Promise<Task[]> {
    const agent = await this.getById(agentId)
    if (!agent) return []
    const taskDb = await loadDb<Task[]>('db.tasks.json', [])
    return taskDb.data.filter((t: Task) => agent.taskIds.includes(t.id))
  },

  async getSessions(agentId: string): Promise<Session[]> {
    const agent = await this.getById(agentId)
    if (!agent) return []
    const sessionDb = await loadDb<Session[]>('db.sessions.json', [])
    return sessionDb.data.filter((s: Session) => s.agentId === agentId)
  },

  async assignToProject(agentId: string, projectId: string): Promise<void> {
    const db = await getDb()
    const projectDb = await loadDb<Project[]>('db.projects.json', [])
    const agent = db.data.find((a: Agent) => a.id === agentId)
    const project = projectDb.data.find((p: Project) => p.id === projectId)
    if (!agent || !project) return

    if (!agent.projectIds.includes(projectId)) {
      agent.projectIds.push(projectId)
      agent.updatedAt = Date.now()
    }
    if (!project.agentIds.includes(agentId)) {
      project.agentIds.push(agentId)
      project.updatedAt = Date.now()
    }
    await db.write()
    await projectDb.write()
  },

  async removeFromProject(agentId: string, projectId: string): Promise<void> {
    const db = await getDb()
    const projectDb = await loadDb<Project[]>('db.projects.json', [])
    const agent = db.data.find((a: Agent) => a.id === agentId)
    const project = projectDb.data.find((p: Project) => p.id === projectId)
    if (agent) {
      agent.projectIds = agent.projectIds.filter((id: string) => id !== projectId)
      agent.updatedAt = Date.now()
    }
    if (project) {
      project.agentIds = project.agentIds.filter((id: string) => id !== agentId)
      project.updatedAt = Date.now()
    }
    await db.write()
    await projectDb.write()
  },

  async addTask(agentId: string, taskId: string): Promise<void> {
    const db = await getDb()
    const agent = db.data.find((a: Agent) => a.id === agentId)
    if (agent && !agent.taskIds.includes(taskId)) {
      agent.taskIds.push(taskId)
      agent.updatedAt = Date.now()
      await db.write()
    }
  },

  async removeTask(agentId: string, taskId: string): Promise<void> {
    const db = await getDb()
    const agent = db.data.find((a: Agent) => a.id === agentId)
    if (agent) {
      agent.taskIds = agent.taskIds.filter((id: string) => id !== taskId)
      agent.updatedAt = Date.now()
      await db.write()
    }
  },

  async addSession(agentId: string, sessionId: string): Promise<void> {
    const db = await getDb()
    const agent = db.data.find((a: Agent) => a.id === agentId)
    if (agent && !agent.sessionIds.includes(sessionId)) {
      agent.sessionIds.push(sessionId)
      agent.updatedAt = Date.now()
      await db.write()
    }
  },

  async removeSession(agentId: string, sessionId: string): Promise<void> {
    const db = await getDb()
    const agent = db.data.find((a: Agent) => a.id === agentId)
    if (agent) {
      agent.sessionIds = agent.sessionIds.filter((id: string) => id !== sessionId)
      agent.updatedAt = Date.now()
      await db.write()
    }
  },
}
