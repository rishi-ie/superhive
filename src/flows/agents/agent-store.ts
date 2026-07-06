import * as React from 'react'
import { agents } from '@/api/agents'
import type {
  Agent,
  RuntimeMessage,
  AdapterEvent,
  AgentStatus,
  InitStep,
} from '@/types/electron'
import type { AgentSettingsState } from './settings'
import { updateAgentSettings } from './settings/update-agent-settings'
import { restartAgent } from './runtime/restart-agent'
import { toast } from 'sonner'

const MAX_MESSAGES = 500
const AUTO_SAVE_DEBOUNCE_MS = 500

interface RuntimeSlice {
  agent: Agent | null
  status: AgentStatus
  messages: RuntimeMessage[]
  lastError?: string
  bootStep?: InitStep
  loading: boolean
  initialized: boolean
  unsubs: Array<() => void>
  refcount: number
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
const trimmedMessageAgents = new Set<string>()

function disposeRuntimeSliceNow(agentId: string): void {
  const slice = runtimeSlices.get(agentId)
  if (!slice) return
  slice.unsubs.forEach((u) => u())
  slice.unsubs = []
  runtimeSlices.delete(agentId)
  trimmedMessageAgents.delete(agentId)
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
    loading: true,
    initialized: false,
    unsubs,
    refcount: 1,
  }

  runtimeSlices.set(agentId, slice)

  agents.getRuntimeState(agentId).then((s) => {
    const entry = runtimeSlices.get(agentId)
    if (!entry || !s) return
    entry.status = s.status
    entry.bootStep = s.bootStep
    entry.lastError = s.lastError
    entry.loading = false
  })

  agents.get(agentId).then((a) => {
    const entry = runtimeSlices.get(agentId)
    if (!entry || !a) return
    entry.agent = a
    if (a.lastError) entry.lastError = a.lastError
  })

  unsubs.push(
    agents.onStatus(agentId, (s) => {
      const entry = runtimeSlices.get(agentId)
      if (!entry) return
      entry.status = s.status
      entry.bootStep = s.bootStep
      entry.lastError = s.lastError
    })
  )

  unsubs.push(
    agents.onMessages(agentId, (msgs) => {
      const entry = runtimeSlices.get(agentId)
      if (!entry) return
      const total = entry.messages.length + msgs.length
      if (total > MAX_MESSAGES) {
        const excess = total - MAX_MESSAGES
        entry.messages = entry.messages.slice(excess)
        if (!trimmedMessageAgents.has(agentId)) {
          trimmedMessageAgents.add(agentId)
          toast.info('Older messages trimmed for performance')
        }
      }
      entry.messages = msgs
    })
  )

  unsubs.push(
    agents.onEvent(agentId, (ev: AdapterEvent) => {
      const entry = runtimeSlices.get(agentId)
      if (!entry) return
      if (ev.type === 'text-delta') {
        const idx = entry.messages.findIndex((m) => m.id === ev.messageId)
        if (idx !== -1) {
          entry.messages[idx] = { ...entry.messages[idx]!, content: entry.messages[idx]!.content + ev.delta }
        }
      } else if (ev.type === 'message-start') {
        if (!entry.messages.some((m) => m.id === ev.messageId)) {
          entry.messages = [
            ...entry.messages,
            { id: ev.messageId, role: ev.role, content: '', ts: Date.now() },
          ]
        }
      } else if (ev.type === 'error') {
        toast.error(ev.message, { duration: Infinity })
        entry.lastError = ev.message
      }
    })
  )

  unsubs.push(
    agents.onExit(agentId, () => {
      agents.getRuntimeState(agentId).then((s) => {
        const entry = runtimeSlices.get(agentId)
        if (!entry || !s) return
        entry.status = s.status
        entry.lastError = s.lastError
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
      setLoading(sliceRef.current.loading)
    }

    sync()

    const id = setInterval(sync, 50)
    return () => {
      clearInterval(id)
    }
  }, [slice])

  const send = React.useCallback((text: string) => {
    if (!agentId) return
    agents.send(agentId, text).catch(() => {})
  }, [agentId])

  const restart = React.useCallback(() => {
    if (!agentId) return
    void restartAgent(agentId)
  }, [agentId])

  return { agent, status, messages, lastError, bootStep, loading, send, restart }
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
    if (entry.debounceTimer) clearTimeout(entry.debounceTimer)
    entry.debounceTimer = setTimeout(async () => {
      const e = settingsSlices.get(agentId)
      if (!e || !e.dirty || Object.keys(e.dirty).length === 0) return
      const p = e.dirty
      e.dirty = null
      e.debounceTimer = null
      await updateAgentSettings({ agentId, patch: p })
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
    await updateAgentSettings({ agentId, patch: p })
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
