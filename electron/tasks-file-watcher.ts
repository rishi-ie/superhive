/**
 * TasksFileWatcher — owns the per-coordinator plan/complete file drop
 * protocol between the orchestration extension (Pi subprocess) and the
 * main process.
 *
 * Two responsibilities:
 *   1. Watch `<userDataPath>/db.tasks.json` for external writes and
 *      broadcast `tasks:changed` to all renderer windows.
 *   2. For each project, watch `<coordDir>/tasks-plan.json` and
 *      `<coordDir>/tasks-complete.jsonl`. Ingest via the pure core
 *      module, then broadcast `tasks:changed`.
 *
 * The orchestration extension can't call Electron (rule 2 in
 * superhive-pi-orchestration/AGENTS.md), so the file drop is the
 * only mechanism for the coordinator to mutate tasks.
 *
 * Pure ingest logic lives in `tasks-file-watcher-core.ts` so tests
 * don't need to mock electron.
 */

import { existsSync, watch, type FSWatcher } from 'node:fs'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import log from 'electron-log/main'
import { getUserDataPath } from '../src/storage/database'
import { IPC } from './ipc'
import { ingestPlan, ingestComplete } from './tasks-file-watcher-core'

const PROJECTS_ROOT = join(homedir(), '.superhive', 'projects')
const COORDINATOR_SUBPATH = 'agent'
const PLAN_FILE = 'tasks-plan.json'
const COMPLETE_FILE = 'tasks-complete.jsonl'
const DEBOUNCE_MS = 250

export type BrowserWindowLike = {
  getAllWindows(): Array<{ isDestroyed(): boolean; webContents: { send(channel: string, payload?: unknown): void } }>
}

let browserWindowProvider: () => BrowserWindowLike = () => ({
  getAllWindows: () => [],
})

/** Inject the Electron BrowserWindow accessor. Called from main.ts. */
export function setBrowserWindowProvider(provider: () => BrowserWindowLike): void {
  browserWindowProvider = provider
}

class TasksFileWatcher {
  private watchers: FSWatcher[] = []
  private debounceTimers = new Map<string, NodeJS.Timeout>()
  private stopped = true
  private userDataPath: string | null = null
  private watchedCoordinatorDirs = new Set<string>()

  start(): void {
    if (!this.stopped) return
    this.stopped = false
    this.userDataPath = getUserDataPath()

    this.attachDbTasksWatch()
    void this.refresh()
    log.info('[tasks-fs-watcher] started')
  }

  stop(): void {
    if (this.stopped) return
    this.stopped = true
    for (const t of this.debounceTimers.values()) clearTimeout(t)
    this.debounceTimers.clear()
    for (const w of this.watchers) {
      try {
        w.close()
      } catch {
        /* ignore */
      }
    }
    this.watchers = []
    this.watchedCoordinatorDirs.clear()
    log.info('[tasks-fs-watcher] stopped')
  }

  /** Push `tasks:changed` to every renderer. Public for IPC handlers
   *  that mutate tasks directly. */
  notifyChanged(): void {
    for (const win of browserWindowProvider().getAllWindows()) {
      if (!win.isDestroyed()) {
        win.webContents.send(IPC.TASKS.ON_CHANGED)
      }
    }
  }

  /** Discover coordinators created after app startup. Watching the directory,
   * not the files, also catches the first task plan written by Pi. */
  async refresh(): Promise<void> {
    if (this.stopped) return
    for (const coordDir of this.getCoordinatorDirs()) {
      this.attachCoordinatorDirWatch(coordDir)
    }
  }

  // --- watchers -----------------------------------------------------------

  private attachDbTasksWatch(): void {
    if (!this.userDataPath) return
    const tasksFile = join(this.userDataPath, 'db.tasks.json')
    if (!existsSync(tasksFile)) return
    try {
      const w = watch(tasksFile, () => this.notifyChanged())
      this.watchers.push(w)
    } catch (err) {
      log.warn(`[tasks-fs-watcher] watch failed for ${tasksFile}:`, err)
    }
  }

  private getCoordinatorDirs(): string[] {
    const roots = new Set<string>()
    if (existsSync(PROJECTS_ROOT)) {
      try {
        for (const entry of readdirSync(PROJECTS_ROOT, { withFileTypes: true })) {
          if (entry.isDirectory() && !entry.name.startsWith('.')) roots.add(join(PROJECTS_ROOT, entry.name))
        }
      } catch (err) {
        log.warn(`[tasks-fs-watcher] failed to list ${PROJECTS_ROOT}:`, err)
      }
    }
    if (this.userDataPath) {
      try {
        const projects = JSON.parse(readFileSync(join(this.userDataPath, 'db.projects.json'), 'utf8')) as Array<{ localPath?: string }>
        for (const project of projects) {
          if (project.localPath) roots.add(project.localPath)
        }
      } catch {
        // The project DB may not exist on first launch.
      }
    }
    return Array.from(roots, (root) => join(root, COORDINATOR_SUBPATH)).filter(existsSync)
  }

  private attachCoordinatorDirWatch(coordDir: string): void {
    if (this.watchedCoordinatorDirs.has(coordDir)) return
    this.watchedCoordinatorDirs.add(coordDir)
    try {
      const watcher = watch(coordDir, (_event, filename) => {
        const name = filename?.toString()
        if (name === PLAN_FILE) this.scheduleDebounced(join(coordDir, PLAN_FILE), () => this.handlePlan(coordDir))
        if (name === COMPLETE_FILE) this.scheduleDebounced(join(coordDir, COMPLETE_FILE), () => this.handleComplete(coordDir))
      })
      this.watchers.push(watcher)
    } catch (err) {
      this.watchedCoordinatorDirs.delete(coordDir)
      log.warn(`[tasks-fs-watcher] watch failed for ${coordDir}:`, err)
    }
  }

  private scheduleDebounced(key: string, fn: () => void): void {
    const existing = this.debounceTimers.get(key)
    if (existing) clearTimeout(existing)
    const timer = setTimeout(() => {
      this.debounceTimers.delete(key)
      try {
        fn()
      } catch (err) {
        log.warn(`[tasks-fs-watcher] handler failed for ${key}:`, err)
      }
    }, DEBOUNCE_MS)
    this.debounceTimers.set(key, timer)
  }

  private async handlePlan(coordDir: string): Promise<void> {
    const { created } = await ingestPlan(coordDir)
    if (created > 0) {
      log.info(`[tasks-fs-watcher] plan ingested: ${created} task(s) at ${coordDir}`)
      this.notifyChanged()
    }
  }

  private async handleComplete(coordDir: string): Promise<void> {
    const { applied } = await ingestComplete(coordDir)
    if (applied > 0) {
      log.info(`[tasks-fs-watcher] complete ingested: ${applied} task(s) at ${coordDir}`)
      this.notifyChanged()
    }
  }
}

export const tasksFileWatcher = new TasksFileWatcher()
