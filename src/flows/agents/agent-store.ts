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
import type { ContentPart } from '@/models/runtime'
import type { CompactionStatus, RetryStatus } from '@/models/runtime'
import type { AgentSettingsState } from './settings'
import { updateAgentSettings } from './settings/update-agent-settings'
import { restartAgent } from './runtime/restart-agent'
import { toast } from 'sonner'

const MAX_MESSAGES = 5000
const AUTO_SAVE_DEBOUNCE_MS = 500

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
  refcount: number
  notify?: () => void
}

interface SettingsSlice {
  settings: AgentSettingsState | null
  isLoading: boolean
  error: string | null
  dirty: Record<string, unknown> | null
  unsub: (() => void) | null
  debounceTimer: NodeJS.Timeout | null
  refcount: number
}

const runtimeSlices = new Map<string, RuntimeSlice>()
const settingsSlices = new Map<string, SettingsSlice>()

/**
 * Append a new content part to a message in the renderer's mirror slice.
 * Returns true if the message was found and updated. Used by the per-event
 * handlers below to apply incremental parts in lockstep with the main process
 * state that lives in the electron runtime.
 */
function appendPart(
  slice: RuntimeSlice,
  messageId: string,
  part: ContentPart,
): boolean {
  const idx = slice.messages.findIndex((m) => m.id === messageId)
  if (idx === -1) return false
  const cur = slice.messages[idx]!
  slice.messages = [
    ...slice.messages.slice(0, idx),
    { ...cur, parts: [...cur.parts, part] },
    ...slice.messages.slice(idx + 1),
  ]
  return true
}

/**
 * Replace the last content part of a message with the result of `fn`. Returns
 * true if the message and trailing part were found. Used by stream deltas
 * (text-delta, thinking-delta, tool-call-delta, tool-execution-update).
 */
function updateLastPart(
  slice: RuntimeSlice,
  messageId: string,
  fn: (last: ContentPart) => ContentPart | null,
): boolean {
  const idx = slice.messages.findIndex((m) => m.id === messageId)
  if (idx === -1) return false
  const cur = slice.messages[idx]!
  const last = cur.parts[cur.parts.length - 1]
  if (!last) return false
  const next = fn(last)
  if (!next) return false
  slice.messages = [
    ...slice.messages.slice(0, idx),
    { ...cur, parts: [...cur.parts.slice(0, -1), next] },
    ...slice.messages.slice(idx + 1),
  ]
  return true
}

function disposeRuntimeSliceNow(agentId: string): void {
  const slice = runtimeSlices.get(agentId)
  if (!slice) return
  slice.unsubs.forEach((u) => u())
  slice.unsubs = []
  runtimeSlices.delete(agentId)
}

function disposeSettingsSliceNow(agentId: string): void {
  const slice = settingsSlices.get(agentId)
  if (!slice) return
  if (slice.debounceTimer) clearTimeout(slice.debounceTimer)
  if (slice.unsub) slice.unsub()
  settingsSlices.delete(agentId)
}

function initRuntimeSlice(agentId: string): RuntimeSlice {
  if (runtimeSlices.has(agentId)) {
    runtimeSlices.get(agentId)!.refcount++
    return runtimeSlices.get(agentId)!
  }

  const unsubs: Array<() => void> = []

  const slice: RuntimeSlice = {
    agent: null,
    status: 'stopped',
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
    refcount: 1,
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
    entry.notify?.()
  })

  agents.get(agentId).then((a) => {
    const entry = runtimeSlices.get(agentId)
    if (!entry || !a) return
    entry.agent = a
    if (a.lastError) entry.lastError = a.lastError
    entry.notify?.()
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
      entry.notify?.()
    })
  )

  unsubs.push(
    agents.onMessages(agentId, (msgs) => {
      const entry = runtimeSlices.get(agentId)
      if (!entry) return
      entry.messages = msgs
      // Renderer cap matches disk trim (5000). Drop the oldest rows that
      // aren't in the just-arrived snapshot. Skip silently — the user
      // shouldn't see a toast (P11.3.2); the chat-fade-bottom + scrolled
      // further-up affordance is enough indication.
      if (entry.messages.length > MAX_MESSAGES) {
        entry.messages = entry.messages.slice(-MAX_MESSAGES)
      }
      entry.notify?.()
    })
  )

  unsubs.push(
    agents.onEvent(agentId, (ev: AdapterEvent) => {
      const entry = runtimeSlices.get(agentId)
      if (!entry) return
      if (ev.type === 'text-delta') {
        const updated = updateLastPart(entry, ev.messageId, (last) => {
          if (last.type === 'text') {
            return { ...last, text: last.text + ev.delta, state: 'streaming' }
          }
          return { type: 'text', text: ev.delta, state: 'streaming' }
        })
        if (!updated) {
          appendPart(entry, ev.messageId, { type: 'text', text: ev.delta, state: 'streaming' })
        }
      } else if (ev.type === 'thinking-start') {
        appendPart(entry, ev.messageId, { type: 'thinking', text: '', state: 'streaming' })
      } else if (ev.type === 'thinking-delta') {
        const updated = updateLastPart(entry, ev.messageId, (last) => {
          if (last.type === 'thinking') {
            return { ...last, text: last.text + ev.delta, state: 'streaming' }
          }
          return null
        })
        if (!updated) {
          appendPart(entry, ev.messageId, { type: 'thinking', text: ev.delta, state: 'streaming' })
        }
      } else if (ev.type === 'thinking-end') {
        const idx = entry.messages.findIndex((m) => m.id === ev.messageId)
        if (idx !== -1) {
          const msg = entry.messages[idx]!
          let flipped = false
          entry.messages = [
            ...entry.messages.slice(0, idx),
            {
              ...msg,
              parts: msg.parts.map((p) => {
                if (flipped || p.type !== 'thinking' || p.state === 'complete') return p
                flipped = true
                return { ...p, text: ev.content || p.text, state: 'complete' as const }
              }),
            },
            ...entry.messages.slice(idx + 1),
          ]
        }
      } else if (ev.type === 'tool-execution-start') {
        entry.inFlightToolCount += 1
        entry.notify?.()
      } else if (ev.type === 'tool-call-start') {
        appendPart(entry, ev.messageId, {
          type: 'tool-call',
          id: ev.toolCallId,
          name: ev.name,
          args: undefined,
          state: 'pending',
        })
      } else if (ev.type === 'tool-call-delta') {
        // Args deltas are JSON-string deltas. We append to whichever text
        // state the tool-call part currently uses — main's logic mirrors
        // this exactly in handleAdapterEvent. The renderer will only parse
        // args once tool-call-end arrives.
        const idx = entry.messages.findIndex((m) => m.id === ev.messageId)
        if (idx === -1) return
        const cur = entry.messages[idx]!
        const partIdx = cur.parts.findIndex(
          (p) => p.type === 'tool-call' && p.id === ev.toolCallId,
        )
        if (partIdx === -1) return
        const part = cur.parts[partIdx]!
        if (part.type !== 'tool-call') return
        const prevArgs = typeof part.args === 'string' ? part.args : ''
        const nextParts = [
          ...cur.parts.slice(0, partIdx),
          { ...part, args: prevArgs + ev.delta, state: 'streaming-args' as const },
          ...cur.parts.slice(partIdx + 1),
        ]
        entry.messages = [
          ...entry.messages.slice(0, idx),
          { ...cur, parts: nextParts },
          ...entry.messages.slice(idx + 1),
        ]
      } else if (ev.type === 'tool-call-end') {
        const idx = entry.messages.findIndex((m) => m.id === ev.messageId)
        if (idx === -1) return
        const cur = entry.messages[idx]!
        const partIdx = cur.parts.findIndex(
          (p) => p.type === 'tool-call' && p.id === ev.toolCallId,
        )
        if (partIdx === -1) return
        const part = cur.parts[partIdx]!
        if (part.type !== 'tool-call') return
        entry.messages = [
          ...entry.messages.slice(0, idx),
          {
            ...cur,
            parts: [
              ...cur.parts.slice(0, partIdx),
              { ...part, args: ev.args, state: 'complete' as const },
              ...cur.parts.slice(partIdx + 1),
            ],
          },
          ...entry.messages.slice(idx + 1),
        ]
      } else if (ev.type === 'tool-execution-end') {
        // Main has already linked the tool-result part onto the message that
        // owns the tool-call. Re-fetch via getMessages so the canonical state
        // is mirrored. Fallback: append to last assistant message if the
        // subscription arrives before main's emitMessages has had a chance.
        if (entry.inFlightToolCount > 0) entry.inFlightToolCount -= 1
        agents.getMessages(agentId).then((msgs) => {
          const e = runtimeSlices.get(agentId)
          if (!e) return
          e.messages = msgs
          e.notify?.()
        })
      } else if (ev.type === 'compaction-start') {
        // Re-fetch status to capture compaction envelope + the parts main
        // may have appended during compaction-end. (Status is also broadcast
        // via onStatus, but the message-level mutation needs getMessages.)
        agents.getRuntimeState(agentId).then((s) => {
          const e = runtimeSlices.get(agentId)
          if (!e || !s) return
          e.compaction = s.compaction
          e.notify?.()
        })
      } else if (ev.type === 'compaction-end') {
        agents.getMessages(agentId).then((msgs) => {
          const e = runtimeSlices.get(agentId)
          if (!e) return
          e.messages = msgs
          e.notify?.()
        })
        agents.getRuntimeState(agentId).then((s) => {
          const e = runtimeSlices.get(agentId)
          if (!e || !s) return
          e.compaction = s.compaction
          e.notify?.()
        })
      } else if (ev.type === 'auto-retry-start' || ev.type === 'auto-retry-end') {
        agents.getRuntimeState(agentId).then((s) => {
          const e = runtimeSlices.get(agentId)
          if (!e || !s) return
          e.retry = s.retry
          e.notify?.()
        })
      } else if (ev.type === 'image-attachment') {
        appendPart(entry, ev.messageId, {
          type: 'image',
          data: ev.data,
          mimeType: ev.mimeType,
        })
      } else if (ev.type === 'message-start') {
        if (!entry.messages.some((m) => m.id === ev.messageId)) {
          entry.messages = [
            ...entry.messages,
            { id: ev.messageId, role: ev.role, parts: [], ts: Date.now() },
          ]
        }
      } else if (ev.type === 'error') {
        toast.error(ev.message, { duration: Infinity })
        entry.lastError = ev.message
      }
      entry.notify?.()
    })
  )

  unsubs.push(
    agents.onExit(agentId, () => {
      agents.getRuntimeState(agentId).then((s) => {
        const entry = runtimeSlices.get(agentId)
        if (!entry || !s) return
        entry.status = s.status
        entry.lastError = s.lastError
        entry.notify?.()
      })
    })
  )

  if (!slice.initialized) {
    agents.getRuntimeState(agentId).then((s) => {
      const entry = runtimeSlices.get(agentId)
      if (!entry) return
      if (s && s.status !== 'stopped' && s.status !== 'error') return
      agents.start(agentId).catch(() => {})
    })
    slice.initialized = true
  }

  return slice
}

function initSettingsSlice(agentId: string): SettingsSlice {
  if (settingsSlices.has(agentId)) {
    settingsSlices.get(agentId)!.refcount++
    return settingsSlices.get(agentId)!
  }

  const slice: SettingsSlice = {
    settings: null,
    isLoading: false,
    error: null,
    dirty: null,
    unsub: null,
    debounceTimer: null,
    refcount: 1,
  }

  settingsSlices.set(agentId, slice)

  const reload = async () => {
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
    } finally {
      const e = settingsSlices.get(agentId)
      if (!e) return
      e.isLoading = false
    }
  }

  reload()

  slice.unsub = agents.onSettingsChanged(agentId, () => { void reload() })

  return slice
}

export function disposeSlice(agentId: string): void {
  disposeRuntimeSliceNow(agentId)
  disposeSettingsSliceNow(agentId)
}

export function useAgentRuntime(agentId: string | undefined) {
  const slice = React.useMemo(() => {
    if (!agentId) return null
    return initRuntimeSlice(agentId)
  }, [agentId])

  const [agent, setAgent] = React.useState<Agent | null>(null)
  const [status, setStatus] = React.useState<AgentStatus>('stopped')
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
    sliceRef.current!.notify = sync
    return () => {
      if (sliceRef.current) sliceRef.current.notify = undefined
    }
  }, [slice])

  React.useEffect(() => {
    if (!agentId) return
    const timeout = setTimeout(async () => {
      const entry = runtimeSlices.get(agentId)
      if (!entry || entry.messages.length > 0) return
      const persisted = await agents.getMessages(agentId)
      if (persisted.length === 0) return
      const current = runtimeSlices.get(agentId)
      if (!current || current.messages.length > 0) return
      current.messages = persisted
      current.notify?.()
    }, 1500)
    return () => clearTimeout(timeout)
  }, [agentId])

  const send = React.useCallback((text: string) => {
    if (!agentId) return
    agents.send(agentId, text).catch(() => {})
  }, [agentId])

  const stop = React.useCallback(() => {
    if (!agentId) return
    agents.stop(agentId).catch(() => {})
  }, [agentId])

  const restart = React.useCallback(() => {
    if (!agentId) return
    void restartAgent(agentId)
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

    const id = setInterval(sync, 50)
    return () => {
      clearInterval(id)
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
      const result = await updateAgentSettings({ agentId, patch: p })
      if (result.ok && result.settings) {
        const cur = settingsSlices.get(agentId)
        if (cur) cur.settings = result.settings
      }
    }, AUTO_SAVE_DEBOUNCE_MS)
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
    const result = await updateAgentSettings({ agentId, patch: p })
    if (result.ok && result.settings) {
      const cur = settingsSlices.get(agentId)
      if (cur) cur.settings = result.settings
    }
  }, [agentId])

  const reload = React.useCallback(async () => {
    if (!agentId) return
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
    } finally {
      const e = settingsSlices.get(agentId)
      if (!e) return
      e.isLoading = false
    }
  }, [agentId])

  return { settings, isLoading, error, patch, flush, reload }
}
