/**
 * Per-agent settings-file fs-watcher.
 *
 * Watches `<agentDir>/Superhive-pi-<basename>.json` for external writes
 * (Tier 1 / Tier 2 settings changes), debounces 100ms, parses the
 * `managedBy` counter, and emits `agent:<id>:settings-changed` only
 * when the on-disk counter strictly exceeds the last seen.
 *
 * Counter race prevention: when the runtime itself writes the file (via
 * `ipc/agents.ts:writeSettings` or `ipc/settings.ts:setProvider` etc.),
 * it calls `markSelfWrite(agentId, counter)` so the watcher ignores the
 * resulting fs-event (the renderer doesn't need a stale echo).
 */
import { promises as fs, watch, type FSWatcher } from 'node:fs'
import log from 'electron-log/main'
import { parseCounter } from '../agent-settings-defaults'
import { IPC } from '../ipc/index'
import type { GeneralKaiRuntime } from '../general-kai-runtime'

const SETTINGS_DEBOUNCE_MS = 100

export function ensureSettingsWatcher(
  rt: GeneralKaiRuntime,
  agentId: string,
  settingsPath: string,
): void {
  if (rt.settingsWatchers.has(agentId)) return
  const win = rt.getWindow()
  if (!win) return

  let debounceTimer: NodeJS.Timeout | null = null
  const watcher: FSWatcher = watch(settingsPath, (eventType) => {
    if (eventType !== 'change' && eventType !== 'rename') return
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
      if (win.isDestroyed()) return
      try {
        const raw = await fs.readFile(settingsPath, 'utf8')
        const parsed = JSON.parse(raw) as { managedBy?: string }
        const onDisk = parseCounter(parsed.managedBy)
        const prev = rt.lastSeenCounter.get(agentId) ?? 0
        if (onDisk <= prev) return
        rt.lastSeenCounter.set(agentId, onDisk)
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
  log.info(`[settings-watcher] started for ${agentId} → ${settingsPath}`)
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

export function markSelfWrite(rt: GeneralKaiRuntime, agentId: string, counter: number): void {
  rt.lastSeenCounter.set(agentId, counter)
}
