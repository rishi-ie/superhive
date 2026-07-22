/**
 * Runtime slice — the singleton cache of per-agent runtime state in the
 * renderer.
 *
 * Phase BD scope:
 *   - `slice.messages: ChatRow[]` holds finalized rows only.
 *   - `slice.inFlight: RuntimeAssistantState | null` is the live workspace
 *     the queue mutates as events arrive. Cleared on freeze.
 *   - The slice's notify path is the bridge from in-flight → persisted:
 *     when `inFlight.frozen === true`, build the AssistantMessage, push to
 *     `slice.messages`, clear `inFlight`. Then fire the
 *     `agents.persistAssistantMessage` IPC for every unfrozen-id row.
 *   - The 60s safety net (renamed from `lineageSafetyNetTimer` →
 *     `frozenSafetyNetTimer`) enqueues `set-frozen` if the freeze never
 *     lands.
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
import type {
  AssistantMessage,
  ChatRow,
} from '@/models/assistant-message'
import {
  clearAgentQueue,
  enqueue,
  setSliceAccessor,
} from './queue'
import { translateEventToOps } from './event-translator'

/**
 * 60s safety net: if `finalize-message` op never lands for an in-flight
 * assistant message (agent crash, dropped event, lost connection),
 * force-freeze after 60s so the renderer can transition state 1 → state 2.
 */
const FROZEN_SAFETY_NET_MS = 60_000

const runtimeSlices = new Map<string, RuntimeSlice>()

setSliceAccessor((agentId) => {
  const slice = runtimeSlices.get(agentId)
  if (!slice) return null
  return {
    slice,
    notify: () => {
      persistFrozenMessages(slice, agentId)
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
  clearFrozenSafetyNet(slice)
  slice.pendingTurn = null
  slice.lastResponseStart = null
  slice.inFlight = null
  runtimeSlices.delete(agentId)
  clearAgentQueue(agentId)
}

/**
 * After every slice notify, scan for newly-finalized assistant messages
 * and IPC them to the main process for persistence. Idempotent via the
 * `persistedFrozenMessages` set so re-renders don't re-fire the IPC.
 *
 * Also drives the 60s frozen safety net: when a new in-flight assistant
 * message begins streaming, start the timer. When the message freezes,
 * clear the timer.
 */
function persistFrozenMessages(slice: RuntimeSlice, agentId: string): void {
  for (const m of slice.messages) {
    if (m.role !== 'assistant') continue
    if (slice.persistedFrozenMessages.has(m.id)) continue
    slice.persistedFrozenMessages.add(m.id)
    const message: AssistantMessage = m
    void agents.persistAssistantMessage(agentId, message).catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.warn(
        `[runtime] persistAssistantMessage failed for ${agentId}/${m.id}:`,
        err,
      )
    })
  }
  // Manage the 60s safety net.
  if (slice.inFlight && !slice.inFlight.frozen) {
    if (!slice.frozenSafetyNetTimer) {
      startFrozenSafetyNet(slice, agentId)
    }
  } else {
    clearFrozenSafetyNet(slice)
  }
}

function startFrozenSafetyNet(slice: RuntimeSlice, agentId: string): void {
  if (slice.frozenSafetyNetTimer) return
  slice.frozenSafetyNetTimer = setTimeout(() => {
    const entry = runtimeSlices.get(agentId)
    if (!entry?.inFlight || entry.inFlight.frozen) return
    enqueue({
      kind: 'set-frozen',
      agentId,
      messageId: entry.inFlight.id,
    })
  }, FROZEN_SAFETY_NET_MS)
}

function clearFrozenSafetyNet(slice: RuntimeSlice): void {
  if (slice.frozenSafetyNetTimer) {
    clearTimeout(slice.frozenSafetyNetTimer)
    slice.frozenSafetyNetTimer = undefined
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
    inFlight: null,
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
    frozenSafetyNetTimer: undefined,
    lastResponseStart: null,
    persistedFrozenMessages: new Set(),
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
      // Main process emits finalized rows on user-send. The queue merges
      // them into `slice.messages`.
      const rows: ChatRow[] = messages
      enqueue({ kind: 'set-messages', agentId, messages: rows })
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
            if (e.pendingTurn || e.lastResponseStart !== null || e.inFlight) {
              if (e.pendingTurnTimeoutId) {
                clearTimeout(e.pendingTurnTimeoutId)
                e.pendingTurnTimeoutId = undefined
              }
              clearFrozenSafetyNet(e)
              e.pendingTurn = null
              e.lastResponseStart = null
            }
            // If a message is mid-stream, freeze it with an `error` or
            // `warning` timeline item. Per Q13: persist with empty response
            // so the user can scroll back and see the failure.
            if (e.inFlight && !e.inFlight.frozen) {
              enqueue({
                kind: 'append-error',
                agentId,
                messageId: e.inFlight.id,
                message: ev.message,
                recoverable: ev.recoverable,
              })
            }
            e.listeners.forEach((l) => l())
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
      const rows: ChatRow[] = msgs
      enqueue({ kind: 'set-messages', agentId, messages: rows })
    })
    slice.initialized = true
  }

  return slice
}
