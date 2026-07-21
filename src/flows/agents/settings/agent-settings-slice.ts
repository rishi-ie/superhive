/**
 * Settings slice lifecycle.
 *
 * Owns the singleton `settingsSlices` map keyed by agentId. Provides
 * `initSettingsSlice`, `reloadSettings`, and `disposeSettingsSliceNow`
 * for `useAgentSettings` to call. The patch/flush logic stays in the
 * React hook (`use-agent-settings.ts`) because it interleaves with
 * `useCallback` and a 500ms debounce.
 *
 * Lifted from `src/stores/agent.ts` (which is being deleted in favor of
 * pure flows). Behavior is identical — same Map, same IPC subscription,
 * same `agents.readSettings` reload path, same toast on error.
 */

import { agents } from '@/api/agents'
import { toast } from 'sonner'
import type { AgentSettingsState, SettingsSlice } from '@/models/agent'

const settingsSlices = new Map<string, SettingsSlice>()

export function disposeSettingsSliceNow(agentId: string): void {
  const slice = settingsSlices.get(agentId)
  if (!slice) return
  if (slice.debounceTimer) clearTimeout(slice.debounceTimer)
  if (slice.unsub) slice.unsub()
  settingsSlices.delete(agentId)
}

export async function reloadSettings(agentId: string): Promise<void> {
  const entry = settingsSlices.get(agentId)
  if (!entry) return
  entry.isLoading = true
  entry.error = null
  try {
    const result = (await agents.readSettings(agentId)) as AgentSettingsState | null
    const e = settingsSlices.get(agentId)
    if (!e) return
    e.settings = result
  } catch (err) {
    const e = settingsSlices.get(agentId)
    if (!e) return
    e.error = err instanceof Error ? err.message : 'Failed to load settings'
    toast.error(e.error)
  } finally {
    const e = settingsSlices.get(agentId)
    if (!e) return
    e.isLoading = false
    e.listeners.forEach((l) => l())
  }
}

export function initSettingsSlice(agentId: string): SettingsSlice {
  const existing = settingsSlices.get(agentId)
  if (existing) return existing

  const slice: SettingsSlice = {
    settings: null,
    isLoading: false,
    error: null,
    dirty: null,
    unsub: null,
    debounceTimer: null,
    listeners: new Set(),
  }

  settingsSlices.set(agentId, slice)

  void reloadSettings(agentId)

  slice.unsub = agents.onSettingsChanged(agentId, () => {
    void reloadSettings(agentId)
  })

  return slice
}

/** Internal accessor used by `use-agent-settings.ts`. */
export function getSettingsSlice(agentId: string): SettingsSlice | undefined {
  return settingsSlices.get(agentId)
}
