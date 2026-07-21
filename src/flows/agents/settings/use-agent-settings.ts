import * as React from 'react'
import { agents } from '@/api/agents'
import { toast } from 'sonner'
import {
  disposeSettingsSliceNow,
  getSettingsSlice,
  initSettingsSlice,
  reloadSettings,
} from './agent-settings-slice'
import type { AgentSettingsState, SettingsSlice } from '@/models/agent'

export type { AgentSettingsState }

const AUTO_SAVE_DEBOUNCE_MS = 500

/**
 * React hook that exposes one agent's settings slice as React state plus
 * `patch` / `flush` / `reload` mutators.
 *
 * Lifted from `src/stores/agent.ts` (which is being deleted). The slice
 * lifecycle (Map, init, reload, dispose) lives in
 * `./agent-settings-slice`; this hook owns the React-bound debounced
 * write machinery because it interleaves with `useCallback`.
 *
 * `patch(key, value)`:
 *   - Mutates `entry.dirty[key] = value` for the eventual IPC write.
 *   - Optimistically applies the patch to `entry.settings` so the UI
 *     reflects the new value before the IPC roundtrip.
 *   - For `key === 'model'`, keeps `defaultProvider` / `defaultModel` /
 *     `enabledModels` in lockstep so the next Pi session starts with the
 *     picked model.
 *   - Schedules a 500ms debounced write.
 *
 * `flush(p)`:
 *   - Cancels the debounce timer and merges `p` into any pending dirty
 *     entries so work isn't dropped.
 *   - Writes immediately (no debounce).
 *
 * `reload()`:
 *   - Re-reads from disk via the IPC.
 */
export function useAgentSettings(agentId: string | null) {
  const slice = React.useMemo(() => {
    if (!agentId) return null
    return initSettingsSlice(agentId)
  }, [agentId])

  const [settings, setSettings] = React.useState<AgentSettingsState | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const sliceRef = React.useRef<SettingsSlice | null>(null)
  sliceRef.current = slice

  React.useEffect(() => {
    if (!slice) return
    const entry = sliceRef.current
    if (!entry) return

    const sync = () => {
      if (!sliceRef.current) return
      setSettings(sliceRef.current.settings)
      setIsLoading(sliceRef.current.isLoading)
      setError(sliceRef.current.error)
    }

    sync()
    entry.listeners.add(sync)
    return () => {
      entry.listeners.delete(sync)
    }
  }, [slice])

  const patch = React.useCallback((key: string, value: unknown) => {
    if (!agentId) return
    const entry = getSettingsSlice(agentId)
    if (!entry) return
    if (!entry.dirty) entry.dirty = {}
    entry.dirty[key] = value
    // Optimistically apply the patch to the slice state so the UI (chat
    // composer dropdown, picker, `hasModel` gate) reflects the new value
    // immediately. The debounced IPC write below will reconcile against the
    // server truth on its way back.
    if (entry.settings) {
      entry.settings = { ...entry.settings, [key]: value }
    }
    // When the user picks a model in the composer, keep `defaultProvider` and
    // `defaultModel` in lockstep. The Pi runtime reads `defaultProvider` /
    // `defaultModel` from the per-agent settings file to resolve the initial
    // model on session start; without this sync, picking a model only updates
    // `model` and the next restart falls through to the env-var fallback.
    // Also maintain `enabledModels` so the picked id is in the scoped set
    // used for cycle-scoped model lists in the Pi session.
    if (key === 'model' && value && typeof value === 'object') {
      const m = value as { provider?: string; name?: string }
      entry.dirty['defaultProvider'] = m.provider ?? ''
      entry.dirty['defaultModel'] = m.name ?? ''
      if (entry.settings) {
        entry.settings = {
          ...entry.settings,
          defaultProvider: m.provider ?? '',
          defaultModel: m.name ?? '',
        }
      }
      if (m.provider && m.name) {
        const pickedId = `${m.provider}:${m.name}`
        const current = (entry.settings?.enabledModels ?? []) as string[]
        if (!current.includes(pickedId)) {
          const nextEnabled = [...current, pickedId]
          entry.dirty['enabledModels'] = nextEnabled
          if (entry.settings) {
            entry.settings = { ...entry.settings, enabledModels: nextEnabled }
          }
        }
      }
    }
    if (entry.debounceTimer) clearTimeout(entry.debounceTimer)
    entry.debounceTimer = setTimeout(async () => {
      const e = getSettingsSlice(agentId)
      if (!e || !e.dirty || Object.keys(e.dirty).length === 0) return
      const p = e.dirty
      e.dirty = null
      e.debounceTimer = null
      try {
        const result = await agents.writeSettings(agentId, p)
        const cur = getSettingsSlice(agentId)
        if (cur) {
          cur.settings = result as AgentSettingsState
          cur.listeners.forEach((l) => l())
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to save settings')
      }
    }, AUTO_SAVE_DEBOUNCE_MS)
    entry.listeners.forEach((l) => l())
  }, [agentId])

  const flush = React.useCallback(async (p: Record<string, unknown>) => {
    if (!agentId) return
    const entry = getSettingsSlice(agentId)
    if (!entry) return
    if (entry.debounceTimer) {
      clearTimeout(entry.debounceTimer)
      entry.debounceTimer = null
    }
    // Merge the explicit `p` into any pending patch so we don't drop work.
    const merged: Record<string, unknown> = entry.dirty
      ? { ...entry.dirty, ...p }
      : { ...p }
    entry.dirty = null
    if (Object.keys(merged).length === 0) return
    try {
      const result = await agents.writeSettings(agentId, merged)
      const cur = getSettingsSlice(agentId)
      if (cur) {
        cur.settings = result as AgentSettingsState
        cur.listeners.forEach((l) => l())
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save settings')
    }
  }, [agentId])

  const reload = React.useCallback(async () => {
    if (!agentId) return
    await reloadSettings(agentId)
  }, [agentId])

  return { settings, isLoading, error, patch, flush, reload }
}

export { disposeSettingsSliceNow }
