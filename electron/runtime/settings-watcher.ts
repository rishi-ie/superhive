/**
 * Per-agent truth-file fs-watcher.
 *
 * Watches `<agentDir>/` (the dir holding all four truth files:
 * settings.json, manage.json, overview.json, inbox.json) for external
 * writes (Tier 1 / Tier 2 changes), debounces 100ms, parses the
 * `managedBy` counter for each file, and emits `agent:<id>:settings-changed`
 * only when the on-disk counter strictly exceeds the last seen.
 *
 * Each of the 4 files has its own counter (the truth ext + the IPC
 * `WRITE_*` handlers stamp it on every write). The watcher tracks
 * counters per file so a write to one file doesn't trigger an echo for
 * the others. The renderer only auto-reloads the matching file.
 *
 * Counter race prevention: when the runtime itself writes (via
 * `ipc/agents.ts:writeSettings` / `writeManage` / `writeOverview` /
 * inbox helpers), it calls `markSelfWrite(agentId, fileKey, counter)`
 * so the watcher ignores the resulting fs-event (the renderer doesn't
 * need a stale echo).
 *
 * Self-write detection: when a write returns a counter, we read it
 * back from the file. If the file's counter equals what we wrote,
 * it's our own write (no echo). External writes always land with a
 * higher counter; the watcher emits.
 */
import { existsSync, readFileSync, watch, type FSWatcher } from 'node:fs'
import { dirname } from 'node:path'
import log from 'electron-log/main'
import { parseCounter } from '../agent-settings-defaults'
import { IPC } from '../ipc/index'
import type { GeneralKaiRuntime } from '../general-kai-runtime'

const SETTINGS_DEBOUNCE_MS = 100

/**
 * The four file keys. The watcher tracks each one's counter separately.
 */
export const TRUTH_FILE_KEYS = ['settings', 'manage', 'overview', 'inbox'] as const
export type TruthFileKey = typeof TRUTH_FILE_KEYS[number]

export function ensureSettingsWatcher(
  rt: GeneralKaiRuntime,
  agentId: string,
  settingsPath: string,
): void {
  if (rt.settingsWatchers.has(agentId)) return
  const win = rt.getWindow()
  if (!win) return

  // Watch the agent dir (one watcher covers all 4 files). Use the
  // settings.json path as the canonical path the caller passed in.
  const watchDir = dirname(settingsPath)

  let debounceTimer: NodeJS.Timeout | null = null
  const watcher: FSWatcher = watch(watchDir, (eventType, filename) => {
    if (eventType !== 'change' && eventType !== 'rename') return
    if (!filename) return
    // Match exactly one of the four file names.
    const lower = filename.toLowerCase()
    if (
      lower !== 'settings.json' &&
      lower !== 'manage.json' &&
      lower !== 'overview.json' &&
      lower !== 'inbox.json'
    ) {
      return
    }
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
      if (win.isDestroyed()) return
      try {
        const filePath = `${watchDir}/${filename}`
        if (!existsSync(filePath)) return
        const raw = await require('node:fs/promises').readFile(filePath, 'utf8')
        const parsed = JSON.parse(raw) as { managedBy?: string }
        const onDisk = parseCounter(parsed.managedBy)
        const fileKey = lower.replace('.json', '') as TruthFileKey
        const prev = rt.lastSeenCounters.get(agentId)?.get(fileKey) ?? 0
        if (onDisk <= prev) return
        rt.lastSeenCounters.get(agentId)?.set(fileKey, onDisk)
        if (!rt.lastSeenCounters.has(agentId)) {
          rt.lastSeenCounters.set(agentId, new Map([[fileKey, onDisk]]))
        }
      } catch {
        return
      }
      win.webContents.send(IPC.AGENTS.ON_SETTINGS_CHANGED(agentId), agentId)
    }, SETTINGS_DEBOUNCE_MS)
  })

  watcher.on('error', (err) => {
    log.warn(`[settings-watcher] error for ${agentId}:`, err)
  })

  rt.settingsWatchers.set(agentId, watcher)
  log.info(`[settings-watcher] started for ${agentId} → ${watchDir}`)
}

export function closeSettingsWatcher(rt: GeneralKaiRuntime, agentId: string): void {
  const existing = rt.settingsWatchers.get(agentId)
  if (!existing) return
  existing.close()
  rt.settingsWatchers.delete(agentId)
  log.info(`[settings-watcher] stopped for ${agentId}`)
}

export function closeAllSettingsWatchers(rt: GeneralKaiRuntime): void {
  for (const [agentId] of rt.settingsWatchers) {
    closeSettingsWatcher(rt, agentId)
  }
}

export function markSelfWrite(
  rt: GeneralKaiRuntime,
  agentId: string,
  fileKey: TruthFileKey,
  counter: number,
): void {
  if (!rt.lastSeenCounters.has(agentId)) {
    rt.lastSeenCounters.set(agentId, new Map())
  }
  rt.lastSeenCounters.get(agentId)!.set(fileKey, counter)
}

// Re-export for callers that need the same parse logic.
export { readFileSync, existsSync };
