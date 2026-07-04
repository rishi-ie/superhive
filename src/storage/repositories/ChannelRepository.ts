import { loadDb } from '../database'
import type { Channel, ChannelType, Agent, Project } from '../types'

const dbPromise = loadDb<Channel[]>('db.channels.json', [])

export const ChannelRepository = {
  async create(data: Omit<Channel, 'id' | 'createdAt' | 'updatedAt' | 'participantAgentIds'>): Promise<Channel> {
    const db = await dbPromise
    const now = Date.now()
    const channel: Channel = {
      id: crypto.randomUUID(),
      name: data.name,
      type: data.type,
      projectId: data.projectId,
      participantAgentIds: [],
      startedAt: data.startedAt,
      endedAt: data.endedAt,
      chatFile: data.chatFile,
      createdAt: now,
      updatedAt: now,
    }
    db.data.push(channel)

    if (data.projectId) {
      const projectDb = await loadDb<Project[]>('db.projects.json', [])
      const project = projectDb.data.find((p: Project) => p.id === data.projectId)
      if (project && !project.channelIds.includes(channel.id)) {
        project.channelIds.push(channel.id)
        project.updatedAt = now
        await projectDb.write()
      }
    }

    await db.write()
    return channel
  },

  async getById(id: string): Promise<Channel | undefined> {
    const db = await dbPromise
    return db.data.find((c: Channel) => c.id === id)
  },

  async getAll(): Promise<Channel[]> {
    const db = await dbPromise
    return db.data
  },

  async getByProject(projectId: string): Promise<Channel[]> {
    const db = await dbPromise
    return db.data.filter((c: Channel) => c.projectId === projectId)
  },

  async getByType(type: ChannelType): Promise<Channel[]> {
    const db = await dbPromise
    return db.data.filter((c: Channel) => c.type === type)
  },

  async update(id: string, data: Partial<Omit<Channel, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Channel | undefined> {
    const db = await dbPromise
    const idx = db.data.findIndex((c: Channel) => c.id === id)
    if (idx === -1) return undefined
    const existing = db.data[idx]
    const updated = { ...existing, ...data, updatedAt: Date.now() } as Channel
    db.data[idx] = updated
    await db.write()
    return updated
  },

  async delete(id: string): Promise<boolean> {
    const db = await dbPromise
    const channel = db.data.find((c: Channel) => c.id === id)
    if (!channel) return false

    db.data = db.data.filter((c: Channel) => c.id !== id)

    if (channel.projectId) {
      const projectDb = await loadDb<Project[]>('db.projects.json', [])
      const project = projectDb.data.find((p: Project) => p.id === channel.projectId)
      if (project) {
        project.channelIds = project.channelIds.filter((cid: string) => cid !== id)
        await projectDb.write()
      }
    }

    const agentDb = await loadDb<Agent[]>('db.agents.json', [])
    channel.participantAgentIds.forEach((agentId: string) => {
      const agent = agentDb.data.find((a: Agent) => a.id === agentId)
      if (agent) {
        agent.sessionIds = agent.sessionIds.filter((sid: string) => sid !== id)
      }
    })
    await agentDb.write()

    await db.write()
    return true
  },

  async addParticipant(channelId: string, agentId: string): Promise<void> {
    const db = await dbPromise
    const channel = db.data.find((c: Channel) => c.id === channelId)
    if (!channel) return

    if (!channel.participantAgentIds.includes(agentId)) {
      channel.participantAgentIds.push(agentId)
      channel.updatedAt = Date.now()
      await db.write()
    }
  },

  async removeParticipant(channelId: string, agentId: string): Promise<void> {
    const db = await dbPromise
    const channel = db.data.find((c: Channel) => c.id === channelId)
    if (channel) {
      channel.participantAgentIds = channel.participantAgentIds.filter((id: string) => id !== agentId)
      channel.updatedAt = Date.now()
      await db.write()
    }
  },

  async getParticipants(channelId: string): Promise<Agent[]> {
    const channel = await this.getById(channelId)
    if (!channel) return []
    const agentDb = await loadDb<Agent[]>('db.agents.json', [])
    return agentDb.data.filter((a: Agent) => channel.participantAgentIds.includes(a.id))
  },

  async start(channelId: string): Promise<void> {
    await this.update(channelId, { startedAt: Date.now(), endedAt: undefined })
  },

  async end(channelId: string): Promise<void> {
    await this.update(channelId, { endedAt: Date.now() })
  },
}
