import { loadDb } from '../database'
import type { Session, Agent } from '../types'

const dbPromise = loadDb<Session[]>('db.sessions.json', [])

export const SessionRepository = {
  async create(data: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>): Promise<Session> {
    const db = await dbPromise
    const now = Date.now()
    const session: Session = {
      id: crypto.randomUUID(),
      name: data.name,
      agentId: data.agentId,
      createdAt: now,
      updatedAt: now,
    }
    db.data.push(session)

    const agentDb = await loadDb<Agent[]>('db.agents.json', [])
    const agent = agentDb.data.find((a: Agent) => a.id === data.agentId)
    if (agent && !agent.sessionIds.includes(session.id)) {
      agent.sessionIds.push(session.id)
      agent.updatedAt = now
      await agentDb.write()
    }

    await db.write()
    return session
  },

  async getById(id: string): Promise<Session | undefined> {
    const db = await dbPromise
    return db.data.find((s: Session) => s.id === id)
  },

  async getAll(): Promise<Session[]> {
    const db = await dbPromise
    return db.data
  },

  async getByAgent(agentId: string): Promise<Session[]> {
    const db = await dbPromise
    return db.data.filter((s: Session) => s.agentId === agentId)
  },

  async update(id: string, data: Partial<Omit<Session, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Session | undefined> {
    const db = await dbPromise
    const idx = db.data.findIndex((s: Session) => s.id === id)
    if (idx === -1) return undefined
    const existing = db.data[idx]
    const updated = { ...existing, ...data, updatedAt: Date.now() } as Session
    db.data[idx] = updated
    await db.write()
    return updated
  },

  async delete(id: string): Promise<boolean> {
    const db = await dbPromise
    const session = db.data.find((s: Session) => s.id === id)
    if (!session) return false

    db.data = db.data.filter((s: Session) => s.id !== id)

    const agentDb = await loadDb<Agent[]>('db.agents.json', [])
    const agent = agentDb.data.find((a: Agent) => a.id === session.agentId)
    if (agent) {
      agent.sessionIds = agent.sessionIds.filter((sid: string) => sid !== id)
      await agentDb.write()
    }

    await db.write()
    return true
  },
}
