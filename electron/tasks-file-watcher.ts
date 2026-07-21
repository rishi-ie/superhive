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
import { readdirSync } from 'node:fs'
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

  start(): void {
    if (!this.stopped) return
    this.stopped = false
    this.userDataPath = getUserDataPath()

    this.attachDbTasksWatch()
    this.attachCoordinatorFileWatches()
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

  private attachCoordinatorFileWatches(): void {
    if (!existsSync(PROJECTS_ROOT)) return
    let projectDirs: string[] = []
    try {
      projectDirs = readdirSync(PROJECTS_ROOT, { withFileTypes: true })
        .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
        .map((d) => join(PROJECTS_ROOT, d.name))
    } catch (err) {
      log.warn(`[tasks-fs-watcher] failed to list ${PROJECTS_ROOT}:`, err)
      return
    }
    for (const dir of projectDirs) {
      const coordDir = join(dir, COORDINATOR_SUBPATH)
      if (!existsSync(coordDir)) continue
      this.attachFileWatch(join(coordDir, PLAN_FILE), () => this.handlePlan(coordDir))
      this.attachFileWatch(join(coordDir, COMPLETE_FILE), () => this.handleComplete(coordDir))
    }
  }

  private attachFileWatch(file: string, onChange: () => void): void {
    if (!existsSync(file)) return
    try {
      const w = watch(file, () => this.scheduleDebounced(file, onChange))
      this.watchers.push(w)
    } catch (err) {
      log.warn(`[tasks-fs-watcher] watch failed for ${file}:`, err)
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
