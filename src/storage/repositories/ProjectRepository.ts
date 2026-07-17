import { loadDb } from '../database'
import type { Project, Agent } from '../types'

let _db: Awaited<ReturnType<typeof loadDb<Project[]>>> | null = null

async function getDb() {
  if (!_db) _db = await loadDb<Project[]>('db.projects.json', [])
  return _db
}

export const ProjectRepository = {
  async create(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'agentIds' | 'taskIds' | 'childProjectIds' | 'archived'>): Promise<Project> {
    const db = await getDb()
    const now = Date.now()
    const project: Project = {
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description,
      localPath: data.localPath,
      okfFolderPath: data.okfFolderPath,
      color: data.color,
      icon: data.icon,
      archived: false,
      agentIds: [],
      taskIds: [],
      childProjectIds: [],
      createdAt: now,
      updatedAt: now,
    }
    db.data.push(project)
    await db.write()
    return project
  },

  async getById(id: string): Promise<Project | undefined> {
    const db = await getDb()
    return db.data.find((p: Project) => p.id === id)
  },

  async getAll(): Promise<Project[]> {
    const db = await getDb()
    return db.data
  },

  async getChildProjects(parentId: string): Promise<Project[]> {
    const db = await getDb()
    return db.data.filter((p: Project) => p.parentProjectId === parentId)
  },

  async getRootProjects(): Promise<Project[]> {
    const db = await getDb()
    return db.data.filter((p: Project) => !p.parentProjectId)
  },

  async update(id: string, data: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Project | undefined> {
    const db = await getDb()
    const idx = db.data.findIndex((p: Project) => p.id === id)
    if (idx === -1) return undefined
    const existing = db.data[idx]
    const updated = { ...existing, ...data, updatedAt: Date.now() } as Project
    db.data[idx] = updated
    await db.write()
    return updated
  },

  async delete(id: string): Promise<boolean> {
    const db = await getDb()
    const len = db.data.length
    db.data = db.data.filter((p: Project) => p.id !== id)
    if (db.data.length === len) return false

    const parentIdx = db.data.findIndex((p: Project) => p.childProjectIds.includes(id))
    if (parentIdx !== -1 && db.data[parentIdx]) {
      db.data[parentIdx]!.childProjectIds = db.data[parentIdx]!.childProjectIds.filter((cid: string) => cid !== id)
    }
    await db.write()

    const agentDb = await loadDb<Agent[]>('db.agents.json', [])
    agentDb.data.forEach((a: Agent) => {
      a.projectIds = a.projectIds.filter((pid: string) => pid !== id)
    })
    await agentDb.write()

    return true
  },

  async getAgents(projectId: string): Promise<Agent[]> {
    const project = await this.getById(projectId)
    if (!project) return []
    const agentDb = await loadDb<Agent[]>('db.agents.json', [])
    return agentDb.data.filter((a: Agent) => project.agentIds.includes(a.id))
  },

  async addAgent(projectId: string, agentId: string): Promise<void> {
    const db = await getDb()
    const agentDb = await loadDb<Agent[]>('db.agents.json', [])
    const project = db.data.find((p: Project) => p.id === projectId)
    const agent = agentDb.data.find((a: Agent) => a.id === agentId)
    if (!project || !agent) return

    if (!project.agentIds.includes(agentId)) {
      project.agentIds.push(agentId)
      project.updatedAt = Date.now()
    }
    if (!agent.projectIds.includes(projectId)) {
      agent.projectIds.push(projectId)
      agent.updatedAt = Date.now()
    }
    await db.write()
    await agentDb.write()
  },

  async removeAgent(projectId: string, agentId: string): Promise<void> {
    const db = await getDb()
    const agentDb = await loadDb<Agent[]>('db.agents.json', [])
    const project = db.data.find((p: Project) => p.id === projectId)
    const agent = agentDb.data.find((a: Agent) => a.id === agentId)
    if (project) {
      project.agentIds = project.agentIds.filter((id: string) => id !== agentId)
      project.updatedAt = Date.now()
    }
    if (agent) {
      agent.projectIds = agent.projectIds.filter((pid: string) => pid !== projectId)
      agent.updatedAt = Date.now()
    }
    await db.write()
    await agentDb.write()
  },

  async addChildProject(parentId: string, childId: string): Promise<void> {
    const db = await getDb()
    const parent = db.data.find((p: Project) => p.id === parentId)
    const child = db.data.find((p: Project) => p.id === childId)
    if (!parent || !child) return

    if (!parent.childProjectIds.includes(childId)) {
      parent.childProjectIds.push(childId)
      parent.updatedAt = Date.now()
    }
    if (!child.parentProjectId) {
      child.parentProjectId = parentId
      child.updatedAt = Date.now()
    }
    await db.write()
  },

  async removeChildProject(parentId: string, childId: string): Promise<void> {
    const db = await getDb()
    const parent = db.data.find((p: Project) => p.id === parentId)
    const child = db.data.find((p: Project) => p.id === childId)
    if (parent) {
      parent.childProjectIds = parent.childProjectIds.filter((id: string) => id !== childId)
      parent.updatedAt = Date.now()
    }
    if (child) {
      child.parentProjectId = undefined
      child.updatedAt = Date.now()
    }
    await db.write()
  },
}
