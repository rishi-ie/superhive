import * as React from 'react'
import { agents } from '@/api/agents'
import type {
  Agent,
  RuntimeMessage,
  AdapterEvent,
  AgentStatus,
  InitStep,
  UsageSnapshot,
  ContextSnapshot,
  ModelInfo,
} from '@/types/electron'
import type { CompactionStatus, RetryStatus } from '@/models/runtime'
import { normalizeToolResult } from '@/models/runtime'
import { toast } from 'sonner'
import {
  clearAgentQueue,
  enqueue,
  setSliceAccessor,
} from '@/stores/agent-stream-queue'

const AUTO_SAVE_DEBOUNCE_MS = 500

type NotifyFn = () => void

interface RuntimeSlice {
  agent: Agent | null
  status: AgentStatus
  messages: RuntimeMessage[]
  lastError?: string
  bootStep?: InitStep
  usage?: UsageSnapshot
  contextUsage?: ContextSnapshot
  availableModels?: ModelInfo[]
  activeModelContextWindow?: number
  activeModelName?: string
  compaction?: CompactionStatus
  retry?: RetryStatus
  inFlightToolCount: number
  loading: boolean
  initialized: boolean
  unsubs: Array<() => void>
  listeners: Set<NotifyFn>
}

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

const runtimeSlices = new Map<string, RuntimeSlice>()
const settingsSlices = new Map<string, SettingsSlice>()

setSliceAccessor((agentId) => {
  const slice = runtimeSlices.get(agentId)
  if (!slice) return null
  return {
    slice,
    notify: () => slice.listeners.forEach((l) => l()),
  }
})

function disposeRuntimeSliceNow(agentId: string): void {
  const slice = runtimeSlices.get(agentId)
  if (!slice) return
  slice.unsubs.forEach((u) => u())
  slice.unsubs = []
  runtimeSlices.delete(agentId)
  clearAgentQueue(agentId)
}

function disposeSettingsSliceNow(agentId: string): void {
  const slice = settingsSlices.get(agentId)
  if (!slice) return
  if (slice.debounceTimer) clearTimeout(slice.debounceTimer)
  if (slice.unsub) slice.unsub()
  settingsSlices.delete(agentId)
}

function initRuntimeSlice(agentId: string): RuntimeSlice {
  const existing = runtimeSlices.get(agentId)
  if (existing) return existing

  const unsubs: Array<() => void> = []

  const slice: RuntimeSlice = {
    agent: null,
    status: 'idle',
    messages: [],
    lastError: undefined,
    bootStep: undefined,
    usage: undefined,
    contextUsage: undefined,
    availableModels: undefined,
    activeModelContextWindow: undefined,
    activeModelName: undefined,
    loading: true,
    initialized: false,
    inFlightToolCount: 0,
    unsubs,
    listeners: new Set(),
  }

  runtimeSlices.set(agentId, slice)

  agents.getRuntimeState(agentId).then((s) => {
    const entry = runtimeSlices.get(agentId)
    if (!entry) return
    if (s) {
      entry.status = s.status
      entry.bootStep = s.bootStep
      entry.lastError = s.lastError
      entry.usage = s.usage
      entry.contextUsage = s.contextUsage
      entry.availableModels = s.availableModels
      entry.activeModelContextWindow = s.activeModelContextWindow
      entry.activeModelName = s.activeModelName
    }
    entry.loading = false
    entry.listeners.forEach((l) => l())
  })

  agents.get(agentId).then((a) => {
    const entry = runtimeSlices.get(agentId)
    if (!entry || !a) return
    entry.agent = a
    if (a.lastError) entry.lastError = a.lastError
    entry.listeners.forEach((l) => l())
  })

  unsubs.push(
    agents.onStatus(agentId, (s) => {
      const entry = runtimeSlices.get(agentId)
      if (!entry) return
      entry.status = s.status
      entry.bootStep = s.bootStep
      entry.lastError = s.lastError
      entry.usage = s.usage
      entry.contextUsage = s.contextUsage
      entry.availableModels = s.availableModels
      entry.activeModelContextWindow = s.activeModelContextWindow
      entry.activeModelName = s.activeModelName
      entry.compaction = s.compaction
      entry.retry = s.retry
      entry.listeners.forEach((l) => l())
    }),
  )

  // Main process emits `entry.messages` via `ON_MESSAGES` after every push
  // (start hydration, send, message-end, completion). This is the only path
  // for user messages into the renderer — Pi's adapter does not emit
  // `message-start` for the user echo (only for assistant events, see
  // `raw-text-adapter.ts`). Main dedupes at push (defensive `message-start`
  // check in `general-kai-runtime.ts`), so the queue's `set-messages` merge
  // sees no duplicate ids. We route through the queue's `set-messages` op
  // instead of overwriting `entry.messages` directly to preserve the
  // queue-as-single-writer invariant and protect in-flight streaming parts.
  unsubs.push(
    agents.onMessages(agentId, (messages) => {
      enqueue({ kind: 'set-messages', agentId, messages })
    }),
  )

  unsubs.push(
    agents.onEvent(agentId, (ev: AdapterEvent) => {
      // High-frequency state-mutation events go through the queue so the
      // renderer re-renders once per 50ms tick instead of once per event.
      // Boundary events and refetches stay immediate.
      switch (ev.type) {
        case 'text-delta': {
          enqueue({
            kind: 'append-delta',
            agentId,
            messageId: ev.messageId,
            partType: 'text',
            delta: ev.delta,
          })
          return
        }
        case 'thinking-start': {
          enqueue({
            kind: 'append-part',
            agentId,
            messageId: ev.messageId,
            part: { type: 'thinking', text: '', state: 'streaming' },
          })
          return
        }
        case 'thinking-delta': {
          enqueue({
            kind: 'append-delta',
            agentId,
            messageId: ev.messageId,
            partType: 'thinking',
            delta: ev.delta,
          })
          return
        }
        case 'thinking-end': {
          enqueue({
            kind: 'finalize-part',
            agentId,
            messageId: ev.messageId,
            partType: 'thinking',
            content: ev.content,
          })
          return
        }
        case 'text-end': {
          enqueue({
            kind: 'finalize-part',
            agentId,
            messageId: ev.messageId,
            partType: 'text',
            content: ev.content,
          })
          return
        }
        case 'tool-call-start': {
          enqueue({
            kind: 'append-part',
            agentId,
            messageId: ev.messageId,
            part: {
              type: 'tool-call',
              id: ev.toolCallId,
              name: ev.name,
              args: undefined,
              state: 'pending',
            },
          })
          return
        }
        case 'tool-call-delta': {
          enqueue({
            kind: 'append-tool-call-delta',
            agentId,
            messageId: ev.messageId,
            toolCallId: ev.toolCallId,
            delta: ev.delta,
          })
          return
        }
        case 'tool-call-end': {
          enqueue({
            kind: 'finalize-tool-call',
            agentId,
            messageId: ev.messageId,
            toolCallId: ev.toolCallId,
            args: ev.args,
          })
          return
        }
        case 'tool-execution-start': {
          enqueue({ kind: 'increment-inflight', agentId, delta: 1 })
          return
        }
        case 'image-attachment': {
          enqueue({
            kind: 'append-part',
            agentId,
            messageId: ev.messageId,
            part: { type: 'image', data: ev.data, mimeType: ev.mimeType },
          })
          return
        }
        case 'message-start': {
          enqueue({
            kind: 'message-start',
            agentId,
            messageId: ev.messageId,
            role: ev.role,
          })
          return
        }
        case 'message-end': {
          enqueue({
            kind: 'finalize-message',
            agentId,
            messageId: ev.messageId,
          })
          return
        }
        // Tool-call end and refetches — the queue is the single writer for
        // message state. `tool-execution-end` carries the result payload in
        // the event itself, so we route it through `finalize-tool-result`
        // instead of refetching from disk. `compaction-end` carries the
        // summary text, routed through `append-compaction-summary`.
        // Status fields (compaction envelope, retry) are not part of message
        // state — they stay on direct runtime-state refetch since they're
        // unrelated to the queue's scope.
        case 'tool-execution-end': {
          enqueue({ kind: 'increment-inflight', agentId, delta: -1 })
          enqueue({
            kind: 'finalize-tool-result',
            agentId,
            toolCallId: ev.toolCallId,
            result: normalizeToolResult(ev.result),
            isError: ev.isError,
          })
          return
        }
        case 'compaction-start': {
          agents.getRuntimeState(agentId).then((s) => {
            const e = runtimeSlices.get(agentId)
            if (!e || !s) return
            e.compaction = s.compaction
            e.listeners.forEach((l) => l())
          })
          return
        }
        case 'compaction-end': {
          if (typeof ev.result === 'string' && ev.result.trim().length > 0) {
            enqueue({
              kind: 'append-compaction-summary',
              agentId,
              summary: ev.result,
              tokensBefore: 0,
            })
          }
          agents.getRuntimeState(agentId).then((s) => {
            const e = runtimeSlices.get(agentId)
            if (!e || !s) return
            e.compaction = s.compaction
            e.listeners.forEach((l) => l())
          })
          return
        }
        case 'auto-retry-start':
        case 'auto-retry-end': {
          agents.getRuntimeState(agentId).then((s) => {
            const e = runtimeSlices.get(agentId)
            if (!e || !s) return
            e.retry = s.retry
            e.listeners.forEach((l) => l())
          })
          return
        }
        case 'error': {
          toast.error(ev.message, { duration: Infinity })
          const e = runtimeSlices.get(agentId)
          if (e) e.lastError = ev.message
          return
        }
      }
    }),
  )

  unsubs.push(
    agents.onExit(agentId, () => {
      agents.getRuntimeState(agentId).then((s) => {
        const entry = runtimeSlices.get(agentId)
        if (!entry || !s) return
        entry.status = s.status
        entry.lastError = s.lastError
        entry.listeners.forEach((l) => l())
      })
    }),
  )

  if (!slice.initialized) {
    agents.getRuntimeState(agentId).then((s) => {
      const entry = runtimeSlices.get(agentId)
      if (!entry) return
      // Start the runtime if it isn't live yet — this also hydrates
      // entry.messages from disk and emits via onMessages.
      if (!s || s.status === 'idle') {
        agents.start(agentId).catch((err: unknown) => {
          toast.error(err instanceof Error ? err.message : 'Failed to start agent')
        })
      }
    })
    // Always fetch messages from disk on slice init and route through the
    // queue as a `set-messages` op so the merge (with streaming-state
    // preservation) is applied centrally. The queue's applyOp is the only
    // writer of `entry.messages`.
    agents.getMessages(agentId).then((msgs) => {
      enqueue({ kind: 'set-messages', agentId, messages: msgs })
    })
    slice.initialized = true
  }

  return slice
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

export function disposeSlice(agentId: string): void {
  disposeRuntimeSliceNow(agentId)
  disposeSettingsSliceNow(agentId)
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

export function useAgentRuntime(agentId: string | undefined) {
  const slice = React.useMemo(() => {
    if (!agentId) return null
    return initRuntimeSlice(agentId)
  }, [agentId])

  const [agent, setAgent] = React.useState<Agent | null>(null)
  const [status, setStatus] = React.useState<AgentStatus>('idle')
  const [messages, setMessages] = React.useState<RuntimeMessage[]>([])
  const [lastError, setLastError] = React.useState<string | undefined>(undefined)
  const [bootStep, setBootStep] = React.useState<InitStep | undefined>(undefined)
  const [usage, setUsage] = React.useState<UsageSnapshot | undefined>(undefined)
  const [contextUsage, setContextUsage] = React.useState<ContextSnapshot | undefined>(undefined)
  const [availableModels, setAvailableModels] = React.useState<ModelInfo[] | undefined>(undefined)
  const [activeModelContextWindow, setActiveModelContextWindow] =
    React.useState<number | undefined>(undefined)
  const [activeModelName, setActiveModelName] = React.useState<string | undefined>(undefined)
  const [compaction, setCompaction] = React.useState<CompactionStatus | undefined>(undefined)
  const [retry, setRetry] = React.useState<RetryStatus | undefined>(undefined)
  const [inFlightToolCount, setInFlightToolCount] = React.useState(0)
  const [loading, setLoading] = React.useState(true)

  const sliceRef = React.useRef<RuntimeSlice | null>(null)
  sliceRef.current = slice

  React.useEffect(() => {
    if (!slice) return
    const entry = sliceRef.current
    if (!entry) return

    const sync = () => {
      if (!sliceRef.current) return
      setAgent(sliceRef.current.agent)
      setStatus(sliceRef.current.status)
      setMessages([...sliceRef.current.messages])
      setLastError(sliceRef.current.lastError)
      setBootStep(sliceRef.current.bootStep)
      setUsage(sliceRef.current.usage)
      setContextUsage(sliceRef.current.contextUsage)
      setAvailableModels(sliceRef.current.availableModels)
      setActiveModelContextWindow(sliceRef.current.activeModelContextWindow)
      setActiveModelName(sliceRef.current.activeModelName)
      setCompaction(sliceRef.current.compaction)
      setRetry(sliceRef.current.retry)
      setInFlightToolCount(sliceRef.current.inFlightToolCount)
      setLoading(sliceRef.current.loading)
    }

    sync()
    entry.listeners.add(sync)
    return () => {
      entry.listeners.delete(sync)
    }
  }, [slice])

  const send = React.useCallback((text: string) => {
    if (!agentId) return
    agents
      .send(agentId, text)
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : 'Failed to send message')
      })
  }, [agentId])

  const stop = React.useCallback(() => {
    if (!agentId) return
    agents
      .stop(agentId)
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : 'Failed to stop agent')
      })
  }, [agentId])

  const restart = React.useCallback(() => {
    if (!agentId) return
    void agents
      .restart(agentId)
      .then((result) => {
        if (!result.ok) toast.error('Failed to restart agent')
      })
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : 'Failed to restart agent')
      })
  }, [agentId])

  return {
    agent,
    status,
    messages,
    lastError,
    bootStep,
    usage,
    contextUsage,
    availableModels,
    activeModelContextWindow,
    activeModelName,
    compaction,
    retry,
    inFlightToolCount,
    loading,
    send,
    stop,
    restart,
  }
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
