/**
 * Pure ingestion logic for tasks plan + complete files.
 *
 * No electron, no fs.watch — just the two ingest functions. The
 * electron-side `tasks-file-watcher.ts` wires these to fs.watch and
 * BrowserWindow broadcasts.
 *
 * Run: `bun test electron/tasks-file-watcher-core.test.ts`
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { TaskRepository } from '../src/storage/repositories/TaskRepository'
import { getUserDataPath } from '../src/storage/database'

const COORDINATOR_SUBPATH = 'agent'

export interface PlanEntry {
  title: string
  description?: string
  dependencies?: string[]
  assignedAgent: string  // member name, resolved to id
}

export interface PlanFile {
  tasks: PlanEntry[]
}

export interface CompleteEntry {
  taskId: string
  summary?: string
  ts: number
}

/**
 * Resolve a project's id from a coordinator dir like
 * `<userDataPath>/projects/<name>/agent` by walking the projects
 * list and matching the localPath prefix. Falls back to a direct
 * db.projects.json read if the repository is mocked or unavailable.
 */
export async function resolveProjectForCoordDir(
  coordDir: string,
): Promise<{ id: string; name: string; agentIds?: string[] } | null> {
  // ponytail: don't depend on ProjectRepository here because the
  // IPC test suite mocks it. Read db.projects.json directly.
  const userData = getUserDataPath()
  if (!userData) return null
  const projectsFile = join(userData, 'db.projects.json')
  if (!existsSync(projectsFile)) return null
  let projects: Array<{ id: string; name: string; localPath?: string; agentIds?: string[] }>
  try {
    projects = JSON.parse(readFileSync(projectsFile, 'utf-8'))
  } catch {
    return null
  }
  for (const p of projects) {
    if (!p.localPath) continue
    if (coordDir === join(p.localPath, COORDINATOR_SUBPATH)) {
      return p
    }
  }
  return null
}

async function loadAgentsById(agentIds: string[]): Promise<Map<string, string>> {
  const userData = getUserDataPath()
  if (!userData) return new Map()
  const agentsFile = join(userData, 'db.agents.json')
  if (!existsSync(agentsFile)) return new Map()
  let agents: Array<{ id: string; name?: string }>
  try {
    agents = JSON.parse(readFileSync(agentsFile, 'utf-8'))
  } catch {
    return new Map()
  }
  const byName = new Map<string, string>()
  for (const id of agentIds) {
    const a = agents.find((x) => x.id === id)
    if (a?.name) byName.set(a.name, a.id)
  }
  return byName
}

export async function ingestPlan(coordDir: string, planFilename = 'tasks-plan.json'): Promise<{ created: number }> {
  const planPath = join(coordDir, planFilename)
  if (!existsSync(planPath)) return { created: 0 }
  let raw: string
  try {
    raw = readFileSync(planPath, 'utf-8')
  } catch {
    return { created: 0 }
  }
  if (!raw.trim()) return { created: 0 }
  let plan: PlanFile
  try {
    plan = JSON.parse(raw)
  } catch {
    return { created: 0 }
  }
  if (!plan || !Array.isArray(plan.tasks)) return { created: 0 }

  const project = await resolveProjectForCoordDir(coordDir)
  if (!project) return { created: 0 }

  const memberByName = await loadAgentsById(project.agentIds ?? [])

  let created = 0
  for (const entry of plan.tasks) {
    const agentId = memberByName.get(entry.assignedAgent)
    if (!agentId) continue
    const task = await TaskRepository.create({
      title: entry.title,
      description: entry.description,
      projectId: project.id,
      assignedAgentId: agentId,
    })
    if (entry.dependencies && entry.dependencies.length > 0) {
      const allTasks = await TaskRepository.getByProject(project.id)
      const byTitle = new Map(allTasks.map((t) => [t.title, t.id]))
      const depIds = entry.dependencies
        .map((title) => byTitle.get(title))
        .filter((id): id is string => Boolean(id))
      if (depIds.length > 0) {
        await TaskRepository.update(task.id, { dependencies: depIds })
      }
    }
    created++
  }

  try {
    writeFileSync(planPath, '')
  } catch {
    /* swallow — next plan call will overwrite */
  }

  return { created }
}

export async function ingestComplete(
  coordDir: string,
  completeFilename = 'tasks-complete.jsonl',
): Promise<{ applied: number }> {
  const completePath = join(coordDir, completeFilename)
  if (!existsSync(completePath)) return { applied: 0 }
  let raw: string
  try {
    raw = readFileSync(completePath, 'utf-8')
  } catch {
    return { applied: 0 }
  }
  if (!raw.trim()) return { applied: 0 }
  const lines = raw.split('\n').filter((l) => l.trim())
  let applied = 0
  for (const line of lines) {
    let entry: CompleteEntry
    try {
      entry = JSON.parse(line)
    } catch {
      continue
    }
    if (!entry.taskId) continue
    await TaskRepository.changeStatus(entry.taskId, 'completed', { outcome: entry.summary })
    applied++
  }
  try {
    writeFileSync(completePath, '')
  } catch {
    /* swallow */
  }
  return { applied }
}
