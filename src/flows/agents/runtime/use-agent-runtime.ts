/**
 * React hook bridge for the agent runtime flow.
 *
 * Reads from the singleton runtime slice (managed by `slice.ts`) and maps
 * each field onto React state. Subscribes to slice changes for re-renders.
 *
 * The hook also exposes imperative actions (`send`, `stop`, `restart`) that
 * go straight through the agents IPC API — they don't mutate the slice
 * directly because the main process is the source of truth for the user
 * message + agent process state.
 */

import * as React from 'react'
import { agents } from '@/api/agents'
import type {
  Agent,
  AgentStatus,
  InitStep,
  UsageSnapshot,
  ContextSnapshot,
  ModelInfo,
  RuntimeAssistantState,
  RuntimeReadiness,
} from '@/types/electron'
import type { ChatRow, TurnInput } from '@/models/assistant-message'
import type { CompactionStatus, RetryStatus } from '@/models/runtime'
import { toast } from 'sonner'
import { initRuntimeSlice } from './slice'
import type { RuntimeSlice } from '@/models/agent'
import { flushAgentManage } from '@/flows/agents/settings/use-agent-manage'

export function useAgentRuntime(agentId: string | undefined) {
  const slice = React.useMemo(() => {
    if (!agentId) return null
    return initRuntimeSlice(agentId)
  }, [agentId])

  const [agent, setAgent] = React.useState<Agent | null>(null)
  const [status, setStatus] = React.useState<AgentStatus>('idle')
  const [messages, setMessages] = React.useState<ChatRow[]>([])
  const [inFlight, setInFlight] = React.useState<RuntimeAssistantState | null>(null)
  const [lastError, setLastError] = React.useState<string | undefined>(undefined)
  const [bootStep, setBootStep] = React.useState<InitStep | undefined>(undefined)
  const [readiness, setReadiness] = React.useState<RuntimeReadiness | undefined>(undefined)
  const [configurationError, setConfigurationError] = React.useState<
    { code: string; message: string; settingsTarget?: string } | undefined
  >(undefined)
  const [usage, setUsage] = React.useState<UsageSnapshot | undefined>(undefined)
  const [contextUsage, setContextUsage] = React.useState<ContextSnapshot | undefined>(undefined)
  const [availableModels, setAvailableModels] = React.useState<ModelInfo[] | undefined>(undefined)
  const [activeModelContextWindow, setActiveModelContextWindow] =
    React.useState<number | undefined>(undefined)
  const [activeModelName, setActiveModelName] = React.useState<string | undefined>(undefined)
  const [activeModelProvider, setActiveModelProvider] = React.useState<string | undefined>(undefined)
  const [compaction, setCompaction] = React.useState<CompactionStatus | undefined>(undefined)
  const [retry, setRetry] = React.useState<RetryStatus | undefined>(undefined)
  const [inFlightToolCount, setInFlightToolCount] = React.useState(0)
  const [pendingTurn, setPendingTurn] = React.useState<
    { userMessageId: string; startedAt: number } | null
  >(null)
  const [agentResponseActive, setAgentResponseActive] = React.useState(false)
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
      setInFlight(sliceRef.current.inFlight)
      setLastError(sliceRef.current.lastError)
      setBootStep(sliceRef.current.bootStep)
      setReadiness(sliceRef.current.readiness)
      setConfigurationError(sliceRef.current.configurationError)
      setUsage(sliceRef.current.usage)
      setContextUsage(sliceRef.current.contextUsage)
      setAvailableModels(sliceRef.current.availableModels)
      setActiveModelContextWindow(sliceRef.current.activeModelContextWindow)
      setActiveModelName(sliceRef.current.activeModelName)
      setActiveModelProvider(sliceRef.current.activeModelProvider)
      setCompaction(sliceRef.current.compaction)
      setRetry(sliceRef.current.retry)
      setInFlightToolCount(sliceRef.current.inFlightToolCount)
      setPendingTurn(sliceRef.current.pendingTurn ? { ...sliceRef.current.pendingTurn } : null)
      setAgentResponseActive(sliceRef.current.agentResponseActive)
      setLoading(sliceRef.current.loading)
    }

    sync()
    entry.listeners.add(sync)
    return () => {
      entry.listeners.delete(sync)
    }
  }, [slice])

  const send = React.useCallback(async (input: TurnInput) => {
    if (!agentId) return
    try {
      // Commit ordinary Manage changes before the next turn starts.
      await flushAgentManage(agentId)
    } catch {
      // The Manage flow already surfaced the persistence failure.
      return
    }
    const s = sliceRef.current
    if (s) {
      if (s.pendingTurnTimeoutId) {
        clearTimeout(s.pendingTurnTimeoutId)
        s.pendingTurnTimeoutId = undefined
      }
      const now = Date.now()
      const userMessageId = `pending-${now}-${Math.random().toString(36).slice(2, 8)}`
      s.pendingTurn = { userMessageId, startedAt: now }
      s.lastResponseStart = now
      s.pendingTurnTimeoutId = setTimeout(() => {
        const cur = sliceRef.current
        if (cur?.pendingTurn?.userMessageId === userMessageId) {
          cur.pendingTurn = null
          cur.lastResponseStart = null
          cur.pendingTurnTimeoutId = undefined
          cur.listeners.forEach((l) => l())
        }
      }, 60_000)
      s.listeners.forEach((l) => l())
    }
    try {
      const result = await agents.send(agentId, input)
      if (!result.ok) throw new Error('Agent is not running')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send message')
    }
  }, [agentId])

  const stop = React.useCallback(() => {
    if (!agentId) return
    agents
      .abortTurn(agentId)
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : 'Failed to stop response')
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
    inFlight,
    lastError,
    bootStep,
    readiness,
    configurationError,
    usage,
    contextUsage,
    availableModels,
    activeModelContextWindow,
    activeModelName,
    activeModelProvider,
    compaction,
    retry,
    inFlightToolCount,
    pendingTurn,
    agentResponseActive,
    loading,
    send,
    stop,
    restart,
  }
}
