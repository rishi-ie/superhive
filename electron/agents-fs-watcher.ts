/**
 * AgentsFsWatcher — keeps `db.agents.json` in sync with the filesystem.
 *
 * DB is a write-through cache of physical folders. The UI only reads the DB;
 * this module owns the pipe between disk reality and DB state.
 *
 * Sources of physical folders:
 *   1. `~/.superhive/agents/<name>/` — top-level standalone agents
 *   2. `~/.superhive/projects/<name>/agent/` — project coordinators
 *
 * Sources of fs events:
 *   - `fs.watch` on each parent dir (low latency, but macOS kqueue coalesces
 *     rapid create+write sequences).
 *   - A 5 s polling fallback that catches anything `fs.watch` missed.
 *
 * Pipeline on every event (debounced 250 ms):
 *   reconcileAgentsOnce()  — adopt orphans, clear stale lastError on
 *                            recovered rows. Returns the rows whose folder
 *                            is now missing.
 *   soft-delete buffer     — for each newly-missing row, arm a 2 s timer.
 *                            If the folder reappears before the timer
 *                            fires, the next reconcile cancels the timer
 *                            (no DB change). Otherwise `AgentRepository.delete`
 *                            runs and cascades projectIds/taskIds/sessionIds
 *                            cleanup already wired in the repo.
 *   broadcast 'agents:changed' so all renderer windows re-fetch.
 */

import { existsSync, watch, type FSWatcher } from 'node:fs'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { BrowserWindow } from 'electron'
import log from 'electron-log/main'
import { reconcileAgentsOnce, evictMissingAgent } from './reconcile-agents'

const DEBOUNCE_MS = 250
const SOFT_DELETE_MS = 2000
const POLL_INTERVAL_MS = 5000

const AGENTS_ROOT = join(homedir(), '.superhive', 'agents')
const PROJECTS_ROOT = join(homedir(), '.superhive', 'projects')
const COORDINATOR_SUBPATH = 'agent'

const IPC_AGENTS_CHANGED = 'agents:changed'

class AgentsFsWatcher {
  private watchers: FSWatcher[] = []
  private debounceTimer: NodeJS.Timeout | null = null
  private pollTimer: NodeJS.Timeout | null = null
  /** agentId → setTimeout handle for a pending soft-delete */
  private softDeleteTimers = new Map<string, NodeJS.Timeout>()
  private stopped = true
  private running = false

  start(): void {
    if (!this.stopped) return
    this.stopped = false

    this.attachDirWatch(AGENTS_ROOT)
    this.attachDirWatch(PROJECTS_ROOT)
    this.attachCoordinatorSubdirWatchers()
    this.startPoll()

    log.info('[fs-watcher] started')
  }

  stop(): void {
    if (this.stopped) return
    this.stopped = true

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
    if (this.pollTimer) {
      clearTimeout(this.pollTimer)
      this.pollTimer = null
    }
    for (const t of this.softDeleteTimers.values()) clearTimeout(t)
    this.softDeleteTimers.clear()
    for (const w of this.watchers) {
      try {
        w.close()
      } catch {
        /* ignore */
      }
    }
    this.watchers = []

    log.info('[fs-watcher] stopped')
  }

  // --- watchers -----------------------------------------------------------

  private attachDirWatch(path: string): void {
    if (!existsSync(path)) return
    try {
      const w = watch(path, () => this.scheduleReconcile())
      this.watchers.push(w)
    } catch (err) {
      log.warn(`[fs-watcher] watch failed for ${path}; polling fallback will carry it:`, err)
    }
  }

  private attachCoordinatorSubdirWatchers(): void {
    if (!existsSync(PROJECTS_ROOT)) return
    let projectDirs: string[] = []
    try {
      projectDirs = readdirSync(PROJECTS_ROOT, { withFileTypes: true })
        .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
        .map((d) => join(PROJECTS_ROOT, d.name))
    } catch (err) {
      log.warn(`[fs-watcher] failed to list ${PROJECTS_ROOT}:`, err)
      return
    }
    for (const dir of projectDirs) {
      this.attachDirWatch(join(dir, COORDINATOR_SUBPATH))
    }
  }

  // --- polling fallback ---------------------------------------------------

  private startPoll(): void {
    if (this.pollTimer) return
    const tick = () => {
      if (this.stopped) return
      this.scheduleReconcile()
      this.pollTimer = setTimeout(tick, POLL_INTERVAL_MS)
    }
    this.pollTimer = setTimeout(tick, POLL_INTERVAL_MS)
  }

  // --- debounce -----------------------------------------------------------

  private scheduleReconcile(): void {
    if (this.stopped) return
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null
      void this.runReconcile()
    }, DEBOUNCE_MS)
  }

  // --- reconcile + soft-delete buffer ------------------------------------

  private async runReconcile(): Promise<void> {
    if (this.stopped) return
    if (this.running) return
    this.running = true
    try {
      const result = await reconcileAgentsOnce()

      // Reconcile soft-delete timers against the freshly-observed missing set.
      const currentlyMissingIds = new Set(result.missing.map((m) => m.id))

      // Cancel timers for rows that are no longer missing (folder reappeared).
      for (const [agentId, timer] of this.softDeleteTimers) {
        if (!currentlyMissingIds.has(agentId)) {
          clearTimeout(timer)
          this.softDeleteTimers.delete(agentId)
          log.info(`[fs-watcher] folder reappeared for ${agentId}; soft-delete cancelled`)
        }
      }

      // Arm timers for newly-missing rows.
      for (const row of result.missing) {
        if (this.softDeleteTimers.has(row.id)) continue
        const timer = setTimeout(() => {
          this.softDeleteTimers.delete(row.id)
          void this.evictNow(row.id)
        }, SOFT_DELETE_MS)
        this.softDeleteTimers.set(row.id, timer)
      }

      const pending = this.softDeleteTimers.size
      if (result.adopted > 0 || result.recovered > 0 || pending > 0) {
        log.info(
          `[fs-watcher] reconcile: adopted=${result.adopted} recovered=${result.recovered} pendingEvictions=${pending}`,
        )
      }

      this.broadcastChanged()
    } catch (err) {
      log.warn('[fs-watcher] reconcile failed:', err)
    } finally {
      this.running = false
    }
  }

  private async evictNow(agentId: string): Promise<void> {
    if (this.stopped) return
    try {
      await evictMissingAgent(agentId)
      log.info(`[fs-watcher] soft-evicted ${agentId} after ${SOFT_DELETE_MS}ms grace`)
      this.broadcastChanged()
    } catch (err) {
      log.warn(`[fs-watcher] soft-evict failed for ${agentId}:`, err)
    }
  }

  // --- IPC broadcast ------------------------------------------------------

  private broadcastChanged(): void {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) {
        win.webContents.send(IPC_AGENTS_CHANGED)
      }
    }
  }

  /** Push `agents:changed` to every renderer. Use after boot reconcile so the
   *  freshly-loaded renderer pulls the up-to-date list without waiting for the
   *  next fs event or the 5 s poll tick. */
  notifyChanged(): void {
    this.broadcastChanged()
  }
}

export const agentsFsWatcher = new AgentsFsWatcher()