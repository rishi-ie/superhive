/**
 * Runtime slice — the singleton cache of per-agent runtime state in the
 * renderer.
 *
 * Phase A scope:
 *   - `slice.messages: RuntimeAssistantState[]` keeps the legacy
 *     `parts + lineage + lineageFrozen` shape so the existing
 *     AssistantMessage UI continues to work unchanged.
 *   - Main process is a pure forwarder (see `general-kai-runtime.ts`):
 *     it does not mirror streaming state. The renderer is the sole
 *     writer of in-flight messages.
 *   - The `setMessageLineage` IPC + 60s safety net are still wired
 *     so the line-merge race fix from the previous phase keeps
 *     working. Phase C will replace this with the
 *     `agents:persistAssistantMessage` IPC.
 *
 * Owns:
 *   - The `runtimeSlices` Map (keyed by agentId, survives component unmount).
 *   - All IPC subscriptions for the runtime flow.
 *   - The wiring between the slice and the queue (`setSliceAccessor`).
 *   - Initial hydration.
 *   - Side-effect handlers for events that don't translate to queue ops.
 */

import { agents } from '@/api/agents'
import type { AdapterEvent } from '@/types/electron'
import { toast } from 'sonner'
import type { RuntimeSlice } from '@/models/agent'
import type { StateOneRow } from '@/models/runtime'
import {
  clearAgentQueue,
  enqueue,
  setSliceAccessor,
} from './queue'
import { translateEventToOps } from './event-translator'

/**
 * 60s safety net: if `finalize-message` op never lands for an in-flight
 * assistant message (agent crash, dropped event, lost connection),
 * force-freeze the lineage after 60s so the renderer can transition
 * state 1 → state 2.
 */
const LINEAGE_SAFETY_NET_MS = 60_000

const runtimeSlices = new Map<string, RuntimeSlice>()

setSliceAccessor((agentId) => {
  const slice = runtimeSlices.get(agentId)
  if (!slice) return null
  return {
    slice,
    notify: () => {
      persistFrozenLineages(slice, agentId)
      slice.listeners.forEach((l) => l())
    },
  }
})

export function disposeRuntimeSliceNow(agentId: string): void {
  const slice = runtimeSlices.get(agentId)
  if (!slice) return
  slice.unsubs.forEach((u) => u())
  slice.unsubs = []
  if (slice.pendingTurnTimeoutId) {
    clearTimeout(slice.pendingTurnTimeoutId)
    slice.pendingTurnTimeoutId = undefined
  }
  clearLineageSafetyNet(slice)
  slice.pendingTurn = null
  slice.lastResponseStart = null
  runtimeSlices.delete(agentId)
  clearAgentQueue(agentId)
}

/**
 * After every slice notify, scan for newly-frozen lineages and IPC them
 * to the main process for persistence. Idempotent via the
 * `persistedFrozenLineages` set so re-renders don't re-fire the IPC.
 *
 * Also drives the 60s lineage safety net: when a new in-flight assistant
 * message begins streaming, start the timer. When the message freezes,
 * clear the timer.
 */
function persistFrozenLineages(slice: RuntimeSlice, agentId: string): void {
  for (const m of slice.messages) {
    if (!m.lineageFrozen) continue
    if (slice.persistedFrozenLineages.has(m.id)) continue
    slice.persistedFrozenLineages.add(m.id)
    const lineage: readonly StateOneRow[] = m.lineage ?? []
    void agents.setMessageLineage(agentId, m.id, lineage).catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.warn(
        `[runtime] setMessageLineage failed for ${agentId}/${m.id}:`,
        err,
      )
    })
  }
  // Manage the 60s safety net.
  const tail = slice.messages[slice.messages.length - 1]
  if (tail && tail.role === 'assistant' && !tail.lineageFrozen) {
    if (!slice.lineageSafetyNetTimer) {
      startLineageSafetyNet(slice, agentId)
    }
  } else {
    clearLineageSafetyNet(slice)
  }
}

function startLineageSafetyNet(slice: RuntimeSlice, agentId: string): void {
  if (slice.lineageSafetyNetTimer) return
  slice.lineageSafetyNetTimer = setTimeout(() => {
    const entry = runtimeSlices.get(agentId)
    if (!entry) return
    for (let i = entry.messages.length - 1; i >= 0; i -= 1) {
      const m = entry.messages[i]!
      if (m.role !== 'assistant') continue
      if (m.lineageFrozen) return
      enqueue({ kind: 'set-lineage', agentId, messageId: m.id })
      return
    }
  }, LINEAGE_SAFETY_NET_MS)
}

function clearLineageSafetyNet(slice: RuntimeSlice): void {
  if (slice.lineageSafetyNetTimer) {
    clearTimeout(slice.lineageSafetyNetTimer)
    slice.lineageSafetyNetTimer = undefined
  }
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
    pendingTurn: null,
    pendingTurnTimeoutId: undefined,
    lineageSafetyNetTimer: undefined,
    lastResponseStart: null,
    persistedFrozenLineages: new Set(),
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

  unsubs.push(
    agents.onMessages(agentId, (messages) => {
      // Phase A: main process emits `entry.messages` after every push
      // (user-send). The queue merges them in.
      enqueue({ kind: 'set-messages', agentId, messages: messages as never })
    }),
  )

  unsubs.push(
    agents.onEvent(agentId, (ev: AdapterEvent) => {
      const ops = translateEventToOps(ev, agentId)
      for (const op of ops) enqueue(op)

      if (ops.length > 0) {
        const e = runtimeSlices.get(agentId)
        if (e?.pendingTurn) {
          if (e.pendingTurnTimeoutId) {
            clearTimeout(e.pendingTurnTimeoutId)
            e.pendingTurnTimeoutId = undefined
          }
          e.pendingTurn = null
          e.listeners.forEach((l) => l())
        }
      }

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
          if (e) {
            e.lastError = ev.message
            if (e.pendingTurn || e.lastResponseStart !== null) {
              if (e.pendingTurnTimeoutId) {
                clearTimeout(e.pendingTurnTimeoutId)
                e.pendingTurnTimeoutId = undefined
              }
              clearLineageSafetyNet(e)
              e.pendingTurn = null
              e.lastResponseStart = null
              e.listeners.forEach((l) => l())
            }
          }
          return
        }
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
      if (!s || s.status === 'idle') {
        agents.start(agentId).catch((err: unknown) => {
          toast.error(err instanceof Error ? err.message : 'Failed to start agent')
        })
      }
    })
    agents.getMessages(agentId).then((msgs) => {
      enqueue({ kind: 'set-messages', agentId, messages: msgs as never })
    })
    slice.initialized = true
  }

  return slice
}
