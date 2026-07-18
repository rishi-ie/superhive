/**
 * Settings + agents-list slice — the leftover store concerns after the
 * runtime pipeline (queue + event translator + slice + hook) moved to
 * `@/flows/agents/runtime/`.
 *
 * What still lives here:
 *   - Settings slice + `useAgentSettings` hook + debounced persist.
 *   - `useAgentsListVersion` — monotonic version counter for the agents
 *     list (broadcast via `agents:changed` by the main-process fs watcher).
 *   - `useAllAgentStatuses` — aggregator that batches per-agent status
 *     subscriptions for the sidebar / projects view.
 *   - `disposeSlice` — combined cleanup used by delete flows (calls both
 *     runtime's `disposeRuntimeSliceNow` and the settings dispose).
 *
 * The runtime slice, IPC event subscriptions, event translator, queue, and
 * `useAgentRuntime` hook moved to `@/flows/agents/runtime/`. UI components
 * should import `useAgentRuntime` from there, not from this module.
 */

import * as React from 'react'
import { agents } from '@/api/agents'
import type { AgentStatus, InitStep } from '@/types/electron'
import { toast } from 'sonner'
import { disposeRuntimeSliceNow } from '@/flows/agents/runtime'

const AUTO_SAVE_DEBOUNCE_MS = 500

type NotifyFn = () => void

interface SettingsSlice {
  settings: AgentSettingsState | null
  isLoading: boolean
  error: string | null
  dirty: Record<string, unknown> | null
  unsub: (() => void) | null
  debounceTimer: ReturnType<typeof setTimeout> | null
  listeners: Set<NotifyFn>
}

export interface AgentSettingsState {
  name?: string
  description?: string
  model?: { provider: string; name: string }
  systemPrompt?: string
  permissions?: { filesystem?: boolean; terminal?: boolean; network?: boolean }
  runtime?: { thinkingLevel?: string; activeTools?: string[] }
  catalog?: {
    skills?: Array<{ path: string; active: boolean }>
    extensions?: Array<{ path: string; active: boolean }>
    prompts?: Array<{ path: string; active: boolean }>
  }
  sessionsIndex?: {
    sessions: Array<{ id: string; name?: string; messageCount: number; cost: number; path: string }>
  }
  [k: string]: unknown
}

const settingsSlices = new Map<string, SettingsSlice>()

function disposeSettingsSliceNow(agentId: string): void {
  const slice = settingsSlices.get(agentId)
  if (!slice) return
  if (slice.debounceTimer) clearTimeout(slice.debounceTimer)
  if (slice.unsub) slice.unsub()
  settingsSlices.delete(agentId)
}

export function disposeSlice(agentId: string): void {
  disposeRuntimeSliceNow(agentId)
  disposeSettingsSliceNow(agentId)
}

async function reloadSettings(agentId: string): Promise<void> {
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

function initSettingsSlice(agentId: string): SettingsSlice {
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
    const entry = settingsSlices.get(agentId)
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
      const e = settingsSlices.get(agentId)
      if (!e || !e.dirty || Object.keys(e.dirty).length === 0) return
      const p = e.dirty
      e.dirty = null
      e.debounceTimer = null
      try {
        const result = await agents.writeSettings(agentId, p)
        const cur = settingsSlices.get(agentId)
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
    const entry = settingsSlices.get(agentId)
    if (!entry) return
    if (entry.debounceTimer) {
      clearTimeout(entry.debounceTimer)
      entry.debounceTimer = null
    }
    entry.dirty = null
    if (Object.keys(p).length === 0) return
    try {
      const result = await agents.writeSettings(agentId, p)
      const cur = settingsSlices.get(agentId)
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

// --- Agents-list invalidation -------------------------------------------
//
// The DB is a write-through cache of the filesystem, kept in sync by
// `electron/agents-fs-watcher.ts`. Whenever the watcher reconciles (boot,
// debounced fs event, soft-delete eviction) it broadcasts `agents:changed`
// on the IPC bus. Components that render the agents list subscribe here
// and re-fetch via `listAgents()` whenever the version bumps.

let agentsListVersion = 0
const agentsListListeners = new Set<() => void>()

/**
 * Returns a monotonic version counter that bumps on every `agents:changed`
 * event. Components include `version` in their effect deps to re-fetch
 * the agents list on every DB change without polling.
 */
export function useAgentsListVersion(): number {
  const [version, setVersion] = React.useState(agentsListVersion)
  React.useEffect(() => {
    const off = agents.onChanged(() => {
      agentsListVersion += 1
      agentsListListeners.forEach((l) => l())
    })
    const listener = () => setVersion(agentsListVersion)
    agentsListListeners.add(listener)
    return () => {
      agentsListListeners.delete(listener)
      off()
    }
  }, [])
  return version
}

export interface AgentLiveState {
  status: AgentStatus
  bootStep?: InitStep
}

interface AggregatorSlice {
  states: Map<string, AgentLiveState>
  refcount: number
  unsubs: Map<string, () => void>
  listeners: Set<NotifyFn>
}

const aggregatorSlices = new Map<string, AggregatorSlice>()

function captureState(
  s: { status: AgentStatus; bootStep?: InitStep } | null | undefined,
): AgentLiveState | null {
  if (!s) return null
  return { status: s.status, bootStep: s.bootStep }
}

function initAggregatorSlice(agentId: string): AggregatorSlice {
  const existing = aggregatorSlices.get(agentId)
  if (existing) {
    existing.refcount++
    return existing
  }
  const slice: AggregatorSlice = {
    states: new Map(),
    refcount: 1,
    unsubs: new Map(),
    listeners: new Set(),
  }
  aggregatorSlices.set(agentId, slice)

  agents.getRuntimeState(agentId).then((s) => {
    const entry = aggregatorSlices.get(agentId)
    if (!entry) return
    const captured = captureState(s)
    if (captured) entry.states.set(agentId, captured)
    entry.listeners.forEach((l) => l())
  })

  const unsub = agents.onStatus(agentId, (s) => {
    const entry = aggregatorSlices.get(agentId)
    if (!entry) return
    entry.states.set(agentId, { status: s.status, bootStep: s.bootStep })
    entry.listeners.forEach((l) => l())
  })
  slice.unsubs.set(agentId, unsub)

  return slice
}

function disposeAggregatorSlice(agentId: string): void {
  const slice = aggregatorSlices.get(agentId)
  if (!slice) return
  slice.refcount -= 1
  if (slice.refcount > 0) return
  for (const u of slice.unsubs.values()) u()
  slice.unsubs.clear()
  aggregatorSlices.delete(agentId)
}

export function useAllAgentStatuses(
  agentIds: string[],
  enabled: boolean = true,
): Map<string, AgentLiveState> {
  const [snapshot, setSnapshot] = React.useState<Map<string, AgentLiveState>>(
    () => new Map(),
  )

  // The id list driving the effect must be content-stable, not reference-
  // stable. `agentIds` is `nonCoordinators.map((a) => a.id)` — a new array
  // reference on every parent render — so a `useMemo` dep would always see
  // a change and rebuild the aggregator subscription on every render,
  // driving an infinite render loop. Track the last deduped+sorted id
  // list in a ref and skip the effect when its contents are unchanged.
  const lastIdsRef = React.useRef<string[]>([])
  const lastEnabledRef = React.useRef<boolean>(enabled)

  React.useEffect(() => {
    const nextIds = Array.from(
      new Set(
        agentIds.filter(
          (id): id is string => typeof id === 'string' && id.length > 0,
        ),
      ),
    ).sort()

    const prevIds = lastIdsRef.current
    const idsUnchanged =
      prevIds.length === nextIds.length &&
      prevIds.every((id, i) => id === nextIds[i])
    const enabledUnchanged = lastEnabledRef.current === enabled

    if (idsUnchanged && enabledUnchanged) return

    lastIdsRef.current = nextIds
    lastEnabledRef.current = enabled

    if (!enabled) return

    for (const id of nextIds) {
      initAggregatorSlice(id)
    }

    const sync = () => {
      setSnapshot((prev) => {
        const next = new Map<string, AgentLiveState>()
        for (const id of nextIds) {
          const slice = aggregatorSlices.get(id)
          const s = slice?.states.get(id)
          if (s) next.set(id, s)
        }
        if (agentLiveStatesEqual(prev, next)) return prev
        return next
      })
    }

    for (const id of nextIds) {
      const slice = aggregatorSlices.get(id)
      if (slice) slice.listeners.add(sync)
    }

    return () => {
      for (const id of nextIds) {
        const slice = aggregatorSlices.get(id)
        if (slice) {
          slice.listeners.delete(sync)
          disposeAggregatorSlice(id)
        }
      }
    }
    // `agentIds` reference changes every parent render by design; the
    // content-stability check above short-circuits no-op runs so this
    // effect only re-subscribes when the actual id list changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentIds, enabled])

  return snapshot
}

function agentLiveStatesEqual(
  a: Map<string, AgentLiveState>,
  b: Map<string, AgentLiveState>,
): boolean {
  if (a.size !== b.size) return false
  for (const [id, next] of b) {
    const prev = a.get(id)
    if (!prev) return false
    if (prev.status !== next.status) return false
    if (prev.bootStep !== next.bootStep) return false
  }
  return true
}
