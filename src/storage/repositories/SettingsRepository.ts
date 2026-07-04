import { loadDb } from '../database'
import type { Setting, SettingType, OwnerType } from '../types'

const dbPromise = loadDb<Setting[]>('db.settings.json', [])

export const SettingsRepository = {
  async create(data: Omit<Setting, 'id' | 'createdAt' | 'updatedAt'>): Promise<Setting> {
    const db = await dbPromise
    const now = Date.now()
    const setting: Setting = {
      id: crypto.randomUUID(),
      ownerType: data.ownerType,
      ownerId: data.ownerId,
      key: data.key,
      label: data.label,
      description: data.description,
      type: data.type,
      value: data.value,
      group: data.group,
      order: data.order,
      createdAt: now,
      updatedAt: now,
    }
    db.data.push(setting)
    await db.write()
    return setting
  },

  async getById(id: string): Promise<Setting | undefined> {
    const db = await dbPromise
    return db.data.find((s: Setting) => s.id === id)
  },

  async getAll(): Promise<Setting[]> {
    const db = await dbPromise
    return db.data
  },

  async getByOwner(ownerType: OwnerType, ownerId: string): Promise<Setting[]> {
    const db = await dbPromise
    return db.data.filter((s: Setting) => s.ownerType === ownerType && s.ownerId === ownerId)
  },

  async getByOwnerAndGroup(ownerType: OwnerType, ownerId: string, group: string): Promise<Setting[]> {
    const db = await dbPromise
    return db.data.filter((s: Setting) => s.ownerType === ownerType && s.ownerId === ownerId && s.group === group)
  },

  async getSetting(ownerType: OwnerType, ownerId: string, key: string): Promise<Setting | undefined> {
    const db = await dbPromise
    return db.data.find((s: Setting) => s.ownerType === ownerType && s.ownerId === ownerId && s.key === key)
  },

  async setSetting(
    ownerType: OwnerType,
    ownerId: string,
    key: string,
    value: unknown,
    type: SettingType = 'text',
    label?: string,
    description?: string,
    group?: string,
    order: number = 0
  ): Promise<Setting> {
    const db = await dbPromise
    const existing = db.data.find((s: Setting) => s.ownerType === ownerType && s.ownerId === ownerId && s.key === key)

    if (existing) {
      existing.value = value
      existing.updatedAt = Date.now()
      await db.write()
      return existing
    }

    return this.create({ ownerType, ownerId, key, value, type, label, description, group, order })
  },

  async update(id: string, data: Partial<Omit<Setting, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Setting | undefined> {
    const db = await dbPromise
    const idx = db.data.findIndex((s: Setting) => s.id === id)
    if (idx === -1) return undefined
    const existing = db.data[idx]
    const updated = { ...existing, ...data, updatedAt: Date.now() } as Setting
    db.data[idx] = updated
    await db.write()
    return updated
  },

  async removeSetting(ownerType: OwnerType, ownerId: string, key: string): Promise<boolean> {
    const db = await dbPromise
    const len = db.data.length
    db.data = db.data.filter((s: Setting) => !(s.ownerType === ownerType && s.ownerId === ownerId && s.key === key))
    if (db.data.length === len) return false
    await db.write()
    return true
  },

  async delete(id: string): Promise<boolean> {
    const db = await dbPromise
    const len = db.data.length
    db.data = db.data.filter((s: Setting) => s.id !== id)
    if (db.data.length === len) return false
    await db.write()
    return true
  },

  async deleteByOwner(ownerType: OwnerType, ownerId: string): Promise<void> {
    const db = await dbPromise
    db.data = db.data.filter((s: Setting) => !(s.ownerType === ownerType && s.ownerId === ownerId))
    await db.write()
  },
}
