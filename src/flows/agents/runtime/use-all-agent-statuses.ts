import * as React from 'react'
import { agents } from '@/api/agents'
import type { AgentStatus, InitStep } from '@/types/electron'
import type { AgentLiveState } from '@/models/agent'

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
