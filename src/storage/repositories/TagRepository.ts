import { loadDb } from '../database'
import type { Tag, Task } from '../types'

let _db: Awaited<ReturnType<typeof loadDb<Tag[]>>> | null = null

async function getDb() {
  if (!_db) _db = await loadDb<Tag[]>('db.tags.json', [])
  return _db
}

export const TagRepository = {
  async create(data: Omit<Tag, 'id' | 'createdAt'>): Promise<Tag> {
    const db = await getDb()
    const now = Date.now()
    const tag: Tag = {
      id: crypto.randomUUID(),
      name: data.name,
      color: data.color,
      createdAt: now,
    }
    db.data.push(tag)
    await db.write()
    return tag
  },

  async getById(id: string): Promise<Tag | undefined> {
    const db = await getDb()
    return db.data.find((t: Tag) => t.id === id)
  },

  async getAll(): Promise<Tag[]> {
    const db = await getDb()
    return db.data
  },

  async getByName(name: string): Promise<Tag | undefined> {
    const db = await getDb()
    return db.data.find((t: Tag) => t.name.toLowerCase() === name.toLowerCase())
  },

  async update(id: string, data: Partial<Omit<Tag, 'id' | 'createdAt'>>): Promise<Tag | undefined> {
    const db = await getDb()
    const idx = db.data.findIndex((t: Tag) => t.id === id)
    if (idx === -1) return undefined
    const existing = db.data[idx]
    const updated = { ...existing, ...data } as Tag
    db.data[idx] = updated
    await db.write()
    return updated
  },

  async delete(id: string): Promise<boolean> {
    const db = await getDb()
    const len = db.data.length
    db.data = db.data.filter((t: Tag) => t.id !== id)
    if (db.data.length === len) return false

    const taskDb = await loadDb<Task[]>('db.tasks.json', [])
    taskDb.data.forEach((task: Task) => {
      task.tagIds = task.tagIds.filter((tid: string) => tid !== id)
    })
    await taskDb.write()

    await db.write()
    return true
  },

  async getTasks(tagId: string): Promise<Task[]> {
    const taskDb = await loadDb<Task[]>('db.tasks.json', [])
    return taskDb.data.filter((t: Task) => t.tagIds.includes(tagId))
  },
}
