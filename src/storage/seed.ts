import { loadDb } from './database'
import type { Workspace } from './types'

export async function seedWorkspace(name: string = 'My Workspace'): Promise<Workspace> {
  const db = await loadDb<Workspace[]>('db.workspaces.json', [])
  const now = Date.now()

  const existing = db.data.find((w: Workspace) => w.name === name)
  if (existing) return existing

  const workspace: Workspace = {
    id: crypto.randomUUID(),
    name,
    createdAt: now,
    updatedAt: now,
  }

  db.data.push(workspace)
  await db.write()

  return workspace
}
