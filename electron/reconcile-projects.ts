/**
 * Reconcile the filesystem with `db.projects.json`.
 *
 * Pairs with `reconcile-agents.ts`. Where agent reconcile discovers the
 * standalone agents tree and the project coordinator subfolders (under
 * each `~/.superhive/projects/<name>/agent`) and keeps agent rows in sync,
 * this module discovers project roots and keeps project rows in sync.
 * The filesystem is the source of truth for project existence: a project
 * row only exists while its folder exists.
 *
 * Validity sentinel: a project root `<root>` is valid iff
 * `<root>/agent/Superhive-pi-agent.json` exists. The agent reconcile uses
 * the same marker, so any folder adopted as a project here will also be
 * adopted as a coordinator agent by the agent reconcile in the same boot
 * cycle.
 *
 * Pipeline (called by boot and by the watcher on every debounced fs event):
 *   reconcileProjects()
 *     1. Adopt: any valid project root that has no matching project row
 *        (by localPath) → create the row, link to the coordinator agent.
 *     2. Drop: any project row whose localPath is set but whose folder
 *        lacks the validity sentinel → delete the row. Cascade cleanup
 *        via ProjectRepository.delete already removes the project id
 *        from agents' projectIds.
 *     3. Skip: project rows with no localPath (virtual projects) are
 *        never touched.
 *     4. Returns the adopted + removed ids so callers can broadcast
 *        a folder-missing event and surface toasts.
 *
 * Folder sources covered:
 *   - `~/.superhive/projects/<name>` (default)
 *   - any project localPath already in the DB (custom paths users picked
 *     at create time)
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, basename, resolve as resolvePath } from 'node:path'
import { homedir } from 'node:os'
import log from 'electron-log/main'
import { ProjectRepository } from '../src/storage/repositories/ProjectRepository'
import { AgentRepository } from '../src/storage/repositories/AgentRepository'
import type { Project, Agent } from '../src/storage/types'
import { settingsFilePathFor } from './agent-settings-defaults'

const PROJECTS_ROOT = join(homedir(), '.superhive', 'projects')
const COORDINATOR_SUBPATH = 'agent'

export interface ReconcileProjectsReport {
  /** New project ids created from orphan folders on disk. */
  adopted: string[]
  /** Projects hard-deleted because their folder vanished. The renderer
   *  uses this list to surface a "folder missing" toast per deletion. */
  removed: Array<{ id: string; name: string }>
}

/** Returns true iff `<root>/agent/Superhive-pi-agent.json` exists. */
export function isValidProjectRoot(root: string): boolean {
  if (!root) return false
  const coordinatorDir = join(root, COORDINATOR_SUBPATH)
  if (!existsSync(coordinatorDir)) return false
  // The settings filename mirrors the coordinator folder basename
  // (`agent`), which is fixed by the create flow — see
  // agent-settings-defaults.ts:settingsFilePathFor.
  return existsSync(settingsFilePathFor(coordinatorDir))
}

/** Walks the default projects root and returns every candidate root path,
 *  whether or not it currently passes the validity check. The caller
 *  decides what's valid. We don't filter here because the reconcile also
 *  needs to walk every existing `Project.localPath` — not just the
 *  default tree. */
function listDefaultProjectRoots(): string[] {
  if (!existsSync(PROJECTS_ROOT)) return []
  const out: string[] = []
  for (const entry of readdirSync(PROJECTS_ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    if (entry.name.startsWith('.')) continue
    out.push(join(PROJECTS_ROOT, entry.name))
  }
  return out
}

function dedupe(roots: Array<string | undefined | null>): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const r of roots) {
    if (!r) continue
    const abs = resolvePath(r)
    if (seen.has(abs)) continue
    seen.add(abs)
    out.push(abs)
  }
  return out
}

/** Read the project name from the coordinator's truth settings file. Falls
 *  back to the folder basename. The settings file is JSON with a top-level
 *  `name` field; if the JSON is malformed we silently fall back. */
function readProjectNameFromDisk(root: string): string {
  const coordinatorDir = join(root, COORDINATOR_SUBPATH)
  const settingsPath = settingsFilePathFor(coordinatorDir)
  const fallback = basename(root)
  if (!existsSync(settingsPath)) return fallback
  try {
    const raw = readFileSync(settingsPath, 'utf8')
    const parsed = JSON.parse(raw) as { name?: string }
    return parsed.name?.trim() || fallback
  } catch {
    return fallback
  }
}

/** Adopt: create a project row for a folder that has no DB record.
 *  No-op if the row already exists (handled by caller). */
async function adoptProject(root: string): Promise<Project | null> {
  const coordinatorDir = join(root, COORDINATOR_SUBPATH)
  // The agent reconcile runs alongside this one; the coordinator agent row
  // may or may not exist yet depending on pass ordering. Look it up by
  // localPath (which the agent reconcile stamps into manifest.json).
  const allAgents = await AgentRepository.getAll()
  const coordinator = allAgents.find(
    (a) => a.localPath === coordinatorDir && a.agentKind === 'project-coordinator',
  )

  const name = readProjectNameFromDisk(root)
  const project = await ProjectRepository.create({
    name,
    localPath: root,
    description: undefined,
  })

  // Link the coordinator agent to this project so the right panel can
  // show its name, model, and status. Mirrors the link step in
  // src/flows/projects/crud/prepare-project.ts:80-92.
  if (coordinator) {
    await ProjectRepository.addAgent(project.id, coordinator.id)
    await AgentRepository.update(coordinator.id, {
      projectIds: Array.from(new Set([...(coordinator.projectIds ?? []), project.id])),
    })
    log.info(
      `[reconcile-projects] adopted ${root} → ${project.id} (coordinator=${coordinator.id})`,
    )
  } else {
    log.info(
      `[reconcile-projects] adopted ${root} → ${project.id} (coordinator agent not yet reconciled)`,
    )
  }

  return project
}

/**
 * Reconcile project rows against the filesystem.
 *
 * Boot semantics: this runs after `reconcileAgents()` so the coordinator
 * agent rows are already canonical (manifest stamped, localPath set). When
 * both passes run, a folder adopted by one is correctly linked by the
 * other.
 *
 * Watcher semantics: this runs after the watcher has had a chance to
 * remove a coordinator agent row whose folder is gone. The next pass will
 * see no matching agent and skip the link step, but will still create or
 * delete the project row based on the folder's validity.
 */
export async function reconcileProjects(): Promise<ReconcileProjectsReport> {
  const report: ReconcileProjectsReport = { adopted: [], removed: [] }

  const dbProjects = await ProjectRepository.getAll()
  const allAgents: Agent[] = await AgentRepository.getAll()

  // Build candidate root set: default tree + every existing project localPath.
  // This catches:
  //   - brand-new folders in the default tree (adopt)
  //   - custom paths the user picked at create time (adopt if missing)
  //   - existing rows to validate (drop if invalid)
  const dbLocalPaths = dbProjects
    .map((p: Project) => p.localPath)
    .filter((p): p is string => typeof p === 'string' && p.length > 0)

  const candidateRoots = dedupe([
    ...listDefaultProjectRoots(),
    ...dbLocalPaths,
  ])

  // Pass 1 — adopt valid roots that have no row yet.
  for (const root of candidateRoots) {
    if (!isValidProjectRoot(root)) continue
    const existing = dbProjects.find((p: Project) => p.localPath === root)
    if (existing) continue
    try {
      const created = await adoptProject(root)
      if (created) {
        report.adopted.push(created.id)
        dbProjects.push(created)
      }
    } catch (err) {
      log.warn(
        `[reconcile-projects] adopt failed for ${root}: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }

  // Pass 2 — drop rows whose folder is missing or invalid. Virtual projects
  // (no localPath) are skipped entirely.
  const validRoots = new Set(candidateRoots.filter(isValidProjectRoot))
  for (const project of dbProjects) {
    if (!project.localPath) continue
    if (validRoots.has(resolvePath(project.localPath))) continue
    try {
      // Capture the name BEFORE delete so the toast can show what was
      // removed even after the row is gone.
      const name = project.name
      const ok = await ProjectRepository.delete(project.id)
      if (ok) {
        report.removed.push({ id: project.id, name })
        log.info(
          `[reconcile-projects] removed ${project.id} (${name}) — folder missing at ${project.localPath}`,
        )
      }
    } catch (err) {
      log.warn(
        `[reconcile-projects] delete failed for ${project.id}: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }

  // Pass 3 — sanity: if a project row references a folder that has a
  // coordinator agent but the agent doesn't know about the project, fix
  // the back-reference. This covers the case where the agent reconcile
  // adopted the coordinator before the project row existed, or where
  // the agent was re-adopted after a wipe.
  const refreshed = await ProjectRepository.getAll()
  for (const project of refreshed) {
    if (!project.localPath) continue
    if (!isValidProjectRoot(project.localPath)) continue
    const coordinatorDir = join(project.localPath, COORDINATOR_SUBPATH)
    const coordinator = allAgents.find(
      (a) => a.localPath === coordinatorDir && a.agentKind === 'project-coordinator',
    )
    if (!coordinator) continue
    if (!(coordinator.projectIds ?? []).includes(project.id)) {
      await AgentRepository.update(coordinator.id, {
        projectIds: Array.from(
          new Set([...(coordinator.projectIds ?? []), project.id]),
        ),
      })
      log.info(
        `[reconcile-projects] back-linked coordinator ${coordinator.id} → project ${project.id}`,
      )
    }
  }

  if (report.adopted.length > 0 || report.removed.length > 0) {
    log.info(
      `[reconcile-projects] done — adopted=${report.adopted.length} removed=${report.removed.length}`,
    )
  }

  return report
}