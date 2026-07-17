/**
 * Reconcile the filesystem with the database.
 *
 * The DB is a write-through cache of the filesystem. This module owns the
 * "discover disk, mutate DB" half of the pipeline. The watcher
 * (`agents-fs-watcher.ts`) owns the "trigger on fs events, gate eviction
 * with a soft-delete buffer" half.
 *
 * Pipeline (called by boot and by the watcher on every debounced fs event):
 *   reconcileAgentsOnce()
 *     1. Adopt orphan folders → create a DB row (write `superhiveId` into
 *        `manifest.json` so the next reconcile matches by id).
 *     2. Recover rows whose `lastError` was "Agent folder missing" and whose
 *        folder is now back on disk → clear `lastError`, leave status.
 *     3. Return rows whose folder is missing. The CALLER decides whether to
 *        evict immediately (boot) or defer with a soft-delete buffer
 *        (watcher).
 *
 * On boot: `reconcileAgents()` calls `reconcileAgentsOnce()` then iterates
 * missing rows and evicts each one via `evictMissingAgent(id)`.
 *
 * On watcher events: `reconcileAgentsOnce()` returns missing rows; the
 * watcher arms a 2 s timer per row and only calls `evictMissingAgent(id)`
 * if the folder hasn't reappeared.
 *
 * Folder sources covered:
 *   - `~/.superhive/agents/<name>/` → `agentKind: 'standard'`
 *   - `~/.superhive/projects/<name>/agent/` → `agentKind: 'project-coordinator'`
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, basename } from 'node:path'
import { homedir } from 'node:os'
import log from 'electron-log/main'
import { AgentRepository } from '../src/storage/repositories/AgentRepository'
import type { Agent, AgentKind } from '../src/storage/types'

const AGENTS_ROOT = join(homedir(), '.superhive', 'agents')
const PROJECTS_ROOT = join(homedir(), '.superhive', 'projects')
const COORDINATOR_SUBPATH = 'agent'

const MISSING_FOLDER_LASTERROR_PREFIX = 'Agent folder missing: '

export interface ReconcileResult {
  adopted: number
  recovered: number
  /** Rows whose folder is currently missing. The caller decides eviction timing. */
  missing: Array<{ id: string; localPath: string }>
}

interface ManifestConfig {
  superhiveId?: string
  version?: number
  workspace?: string
  extensions?: string[]
  environment?: Record<string, string>
  [k: string]: unknown
}

function readManifest(agentDir: string): ManifestConfig | null {
  const manifestPath = join(agentDir, 'manifest.json')
  if (!existsSync(manifestPath)) return null
  try {
    return JSON.parse(readFileSync(manifestPath, 'utf8')) as ManifestConfig
  } catch {
    return null
  }
}

function writeManifestSuperhiveId(agentDir: string, id: string): void {
  const manifestPath = join(agentDir, 'manifest.json')
  let parsed: ManifestConfig = {}
  if (existsSync(manifestPath)) {
    try {
      parsed = JSON.parse(readFileSync(manifestPath, 'utf8')) as ManifestConfig
    } catch {
      parsed = {}
    }
  }
  parsed.superhiveId = id
  writeFileSync(manifestPath, JSON.stringify(parsed, null, 2) + '\n', 'utf8')
  // Keep the agent.json → manifest.json symlink consistent. Symlinks created
  // by the agent-create IPC mirror the file content via symlink, so writing
  // the canonical path covers both.
}

function readSettingsName(agentDir: string, fallback: string): string {
  const folderName = basename(agentDir)
  const settingsPath = join(agentDir, `Superhive-pi-${folderName}.json`)
  if (!existsSync(settingsPath)) return fallback
  try {
    const parsed = JSON.parse(readFileSync(settingsPath, 'utf8')) as { name?: string }
    return parsed.name?.trim() || fallback
  } catch {
    return fallback
  }
}

function listAgentDirs(): Array<{ dir: string; kind: AgentKind }> {
  const out: Array<{ dir: string; kind: AgentKind }> = []
  if (existsSync(AGENTS_ROOT)) {
    for (const entry of readdirSync(AGENTS_ROOT, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      if (entry.name.startsWith('.')) continue
      if (entry.name === 'general-kai-template') continue
      out.push({ dir: join(AGENTS_ROOT, entry.name), kind: 'standard' })
    }
  }
  if (existsSync(PROJECTS_ROOT)) {
    for (const entry of readdirSync(PROJECTS_ROOT, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      if (entry.name.startsWith('.')) continue
      const coordinatorDir = join(PROJECTS_ROOT, entry.name, COORDINATOR_SUBPATH)
      if (existsSync(coordinatorDir)) {
        out.push({ dir: coordinatorDir, kind: 'project-coordinator' })
      }
    }
  }
  return out
}

function isAgentSettingsMarker(agentDir: string): boolean {
  // An agent folder must contain a settings file to be considered a real
  // Superhive agent. Without this marker, an unrelated folder in
  // `~/.superhive/agents/` would be auto-adopted.
  const folderName = basename(agentDir)
  const settingsPath = join(agentDir, `Superhive-pi-${folderName}.json`)
  return existsSync(settingsPath)
}

/**
 * Adopt orphan folders and clear stale lastError on recovered rows.
 * Returns the rows whose folder is currently missing — the caller owns
 * eviction timing.
 */
export async function reconcileAgentsOnce(): Promise<ReconcileResult> {
  const result: ReconcileResult = { adopted: 0, recovered: 0, missing: [] }

  const dbAgents = await AgentRepository.getAll()
  const byId = new Map<string, Agent>()
  const byLocalPath = new Map<string, Agent>()
  for (const a of dbAgents) {
    byId.set(a.id, a)
    if (a.localPath) byLocalPath.set(a.localPath, a)
  }

  const diskDirs = listAgentDirs()
  const seenLocalPaths = new Set<string>()

  // Pass 1 — adopt orphans + recover
  for (const { dir, kind } of diskDirs) {
    if (!isAgentSettingsMarker(dir)) continue
    seenLocalPaths.add(dir)

    const manifest = readManifest(dir)
    let dbRow: Agent | undefined

    if (manifest?.superhiveId && byId.has(manifest.superhiveId)) {
      dbRow = byId.get(manifest.superhiveId)
      if (dbRow && dbRow.localPath !== dir) {
        // The folder moved (or got renamed). Update the DB pointer so it
        // doesn't look "missing" on the next pass.
        log.info(
          `[reconcile] ${dbRow.name} (${dbRow.id}) moved: ${dbRow.localPath} → ${dir}`,
        )
        await AgentRepository.update(dbRow.id, { localPath: dir })
        dbRow = { ...dbRow, localPath: dir }
      }
    } else if (byLocalPath.has(dir)) {
      // Folder has no manifest id but DB knows the path. Stamp the id into
      // the manifest so future reconciles are idempotent.
      dbRow = byLocalPath.get(dir)
      if (dbRow) writeManifestSuperhiveId(dir, dbRow.id)
    } else {
      // Truly orphan — adopt.
      const folderName = basename(dir)
      const name = readSettingsName(dir, folderName)
      const created = await AgentRepository.create({
        name,
        localPath: dir,
        status: 'idle',
        agentKind: kind,
      })
      writeManifestSuperhiveId(dir, created.id)
      byId.set(created.id, created)
      byLocalPath.set(dir, created)
      dbRow = created
      result.adopted++
      log.info(`[reconcile] adopted ${dir} → ${created.id}`)
    }

    // Recover rows whose lastError was a stale "Agent folder missing" and the
    // folder is now back on disk.
    if (dbRow && dbRow.lastError?.startsWith(MISSING_FOLDER_LASTERROR_PREFIX)) {
      await AgentRepository.update(dbRow.id, { lastError: undefined })
      log.info(`[reconcile] recovered ${dbRow.name} (${dbRow.id})`)
      result.recovered++
    }
  }

  // Pass 2 — report missing (caller decides eviction)
  const refreshed = await AgentRepository.getAll()
  for (const agent of refreshed) {
    if (!agent.localPath) continue
    if (seenLocalPaths.has(agent.localPath)) continue
    if (existsSync(agent.localPath)) continue
    result.missing.push({ id: agent.id, localPath: agent.localPath })
  }

  return result
}

/**
 * Evict a single agent row whose folder is gone. Cascades projectIds /
 * taskIds / sessionIds cleanup (already wired in AgentRepository.delete).
 */
export async function evictMissingAgent(agentId: string): Promise<boolean> {
  const agent = await AgentRepository.getById(agentId)
  if (!agent) return false
  return AgentRepository.delete(agentId)
}

/**
 * Boot-time entry point: adopt + recover + evict any rows whose folder
 * is gone. Eviction is immediate on boot — there's no soft-delete window
 * because no UI is observing the transition.
 */
export async function reconcileAgents(): Promise<void> {
  log.info('[reconcile] starting')
  const result = await reconcileAgentsOnce()
  let evicted = 0
  for (const row of result.missing) {
    const ok = await evictMissingAgent(row.id)
    if (ok) {
      evicted++
      log.info(`[reconcile] evicted missing folder for ${row.id} (${row.localPath})`)
    }
  }
  log.info(
    `[reconcile] done — adopted=${result.adopted} recovered=${result.recovered} evicted=${evicted}`,
  )
}