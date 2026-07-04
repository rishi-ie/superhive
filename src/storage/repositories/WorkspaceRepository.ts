import { loadDb } from '../database'
import type { Workspace } from '../types'

const dbPromise = loadDb<Workspace[]>('db.workspaces.json', [])

export const WorkspaceRepository = {
  async create(data: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workspace> {
    const db = await dbPromise
    const now = Date.now()
    const workspace: Workspace = {
      id: crypto.randomUUID(),
      name: data.name,
      createdAt: now,
      updatedAt: now,
    }
    db.data.push(workspace)
    await db.write()
    return workspace
  },

  async getById(id: string): Promise<Workspace | undefined> {
    const db = await dbPromise
    return db.data.find((w: Workspace) => w.id === id)
  },

  async getAll(): Promise<Workspace[]> {
    const db = await dbPromise
    return db.data
  },

  async update(id: string, data: Partial<Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Workspace | undefined> {
    const db = await dbPromise
    const idx = db.data.findIndex((w: Workspace) => w.id === id)
    if (idx === -1) return undefined
    const existing = db.data[idx]
    const updated = { ...existing, ...data, updatedAt: Date.now() } as Workspace
    db.data[idx] = updated
    await db.write()
    return updated
  },

  async delete(id: string): Promise<boolean> {
    const db = await dbPromise
    const len = db.data.length
    db.data = db.data.filter((w: Workspace) => w.id !== id)
    if (db.data.length === len) return false
    await db.write()
    return true
  },
}
