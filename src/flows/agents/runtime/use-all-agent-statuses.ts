import * as React from 'react'
import { agents } from '@/api/agents'
import type { AgentStatus, InitStep } from '@/types/electron'
import type { AgentLiveState } from '@/models/agent'
import { initRuntimeSlice } from './slice'

interface AggregatorSlice {
  states: Map<string, AgentLiveState>
  refcount: number
  unsubs: Map<string, () => void>
  listeners: Set<() => void>
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

  // Project workers can receive trusted background turns without their chat
  // page being open. Keep the shared runtime slice subscribed so those turns
  // are assembled and persisted, ready to display when the worker chat opens.
  initRuntimeSlice(agentId)

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

/**
 * Aggregates live runtime status for many agents. Subscribes once per
 * agent (refcounted) and returns a `Map<agentId, AgentLiveState>` that
 * updates on `agents.onStatus`.
 *
 * Lifted from `src/stores/agent.ts`. The content-stability guard is
 * preserved — `agentIds` reference changes every parent render by
 * design; the inner check skips no-op re-subscriptions.
 */
export function useAllAgentStatuses(
  agentIds: string[],
  enabled: boolean = true,
): Map<string, AgentLiveState> {
  const [snapshot, setSnapshot] = React.useState<Map<string, AgentLiveState>>(
    () => new Map(),
  )

  // `agentIds` is often a new array on each parent render. Depend on its
  // normalized value so React does not clean up live subscriptions first.
  const idsKey = Array.from(
    new Set(agentIds.filter((id): id is string => typeof id === 'string' && id.length > 0)),
  ).sort().join(',')

  React.useEffect(() => {
    const nextIds = idsKey ? idsKey.split(',') : []

    if (!enabled || nextIds.length === 0) {
      setSnapshot((previous) => previous.size === 0 ? previous : new Map())
      return
    }

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
    sync()

    return () => {
      for (const id of nextIds) {
        const slice = aggregatorSlices.get(id)
        if (slice) {
          slice.listeners.delete(sync)
          disposeAggregatorSlice(id)
        }
      }
    }
  }, [idsKey, enabled])

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
