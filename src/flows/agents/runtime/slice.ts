/**
 * Runtime slice — the singleton cache of per-agent runtime state in the
 * renderer.
 *
 * Owns:
 *   - The `runtimeSlices` Map (keyed by agentId, survives component unmount).
 *   - All IPC subscriptions for the runtime flow (`onStatus`, `onEvent`,
 *     `onMessages`, `onExit`).
 *   - The wiring between the slice and the queue (`setSliceAccessor`).
 *   - Initial hydration (`getRuntimeState`, `get`, `getMessages`, `start`).
 *   - Side-effect handlers for events that don't translate to queue ops
 *     (status refetches, toasts).
 *
 * What does NOT live here:
 *   - The queue mechanics → `queue.ts`.
 *   - The event → op translation → `event-translator.ts`.
 *   - The React hook bridge → `use-agent-runtime.ts`.
 *   - Settings persistence → `flows/agents/settings/` (separate flow).
 *   - Aggregator / list-version hooks → `flows/agents/list/`.
 *
 * The queue is wired to this slice via `setSliceAccessor` at module load.
 * This avoids an import cycle (queue ↔ slice) by having queue read the
 * accessor lazily at tick time, not at module-load time.
 */

import { agents } from '@/api/agents'
import type { AdapterEvent } from '@/types/electron'
import { toast } from 'sonner'
import type { RuntimeSlice } from '@/models/agent'
import {
  clearAgentQueue,
  enqueue,
  setSliceAccessor,
} from './queue'
import { translateEventToOps } from './event-translator'

const runtimeSlices = new Map<string, RuntimeSlice>()

setSliceAccessor((agentId) => {
  const slice = runtimeSlices.get(agentId)
  if (!slice) return null
  return {
    slice,
    notify: () => slice.listeners.forEach((l) => l()),
  }
})

export function disposeRuntimeSliceNow(agentId: string): void {
  const slice = runtimeSlices.get(agentId)
  if (!slice) return
  slice.unsubs.forEach((u) => u())
  slice.unsubs = []
  runtimeSlices.delete(agentId)
  clearAgentQueue(agentId)
}

export function initRuntimeSlice(agentId: string): RuntimeSlice {
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
    activeModelProvider: undefined,
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
      entry.activeModelProvider = s.activeModelProvider
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
      entry.activeModelProvider = s.activeModelProvider
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
      for (const op of translateEventToOps(ev, agentId)) enqueue(op)

      // Side effects for events that don't translate to queue ops.
      switch (ev.type) {
        case 'compaction-start':
        case 'compaction-end':
        case 'auto-retry-start':
        case 'auto-retry-end': {
          agents.getRuntimeState(agentId).then((s) => {
            const e = runtimeSlices.get(agentId)
            if (!e || !s) return
            if (ev.type === 'compaction-start' || ev.type === 'compaction-end') {
              e.compaction = s.compaction
            }
            if (ev.type === 'auto-retry-start' || ev.type === 'auto-retry-end') {
              e.retry = s.retry
            }
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
        // All other events are pure queue ops (handled by translator) or
        // status-only events (handled by onStatus subscription above).
        default:
          return
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
