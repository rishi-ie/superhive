/**
 * AdapterEvent dispatch. Maps each of the 22 `AdapterEvent` variants
 * emitted by `pi-protocol/raw-text-adapter` onto runtime side-effects
 * (status transitions, broadcasts, in-memory state mutations).
 *
 * The main process is a pure forwarder for streaming events: it does
 * NOT mutate `entry.messages` on streaming events. The renderer is the
 * sole owner of in-flight state. This module only mutates entry-level
 * fields (`status`, `lastError`, `bootStep`, `usage`, `compaction`,
 * `retry`) and broadcasts to the renderer.
 */
import log from 'electron-log/main'
import type { AdapterEvent } from '../pi-protocol'
import type { GeneralKaiRuntime } from '../general-kai-runtime'

export function handleAdapterEvent(
  rt: GeneralKaiRuntime,
  agentId: string,
  event: AdapterEvent,
): void {
  const entry = rt.entries.get(agentId)
  if (!entry) return

  if (event.type === 'boot-step') {
    entry.bootStep = event.step
    rt.emitStatus(agentId)
    return
  }

  if (event.type === 'ready') {
    rt.transitionStatus(entry, 'active')
    log.debug(`[runtime.event] agent=${agentId} type=ready`)
    return
  }

  if (event.type === 'message-start') {
    // Phase A: no in-flight placeholder is pushed. The renderer
    // creates its own in-flight state on receipt of this event.
    rt.transitionStatus(entry, 'busy')
    log.debug(`[runtime.event] agent=${agentId} type=message-start role=${event.role}`)
    rt.emitEvent(agentId, event)
    return
  }

  if (event.type === 'message-end') {
    // Phase A: the finalized AssistantMessage is constructed and
    // pushed by the renderer in Phase B (via the queue's
    // `finalize-message` op + `persistAssistantMessage` IPC in
    // Phase C). For now, just transition status and forward.
    rt.transitionStatus(entry, 'active')
    log.debug(`[runtime.event] agent=${agentId} type=message-end`)
    rt.emitEvent(agentId, event)
    return
  }

  if (event.type === 'error') {
    log.debug(`[runtime.event] agent=${agentId} type=error message=${JSON.stringify(event.message)} recoverable=${event.recoverable}`)
    entry.lastError = event.message
    rt.transitionStatus(entry, 'active')
    rt.emitEvent(agentId, event)
    return
  }

  if (event.type === 'usage') {
    if (entry.extensionLoaded) return
    entry.usage = event.usage
    rt.emitStatus(agentId)
    return
  }

  if (event.type === 'compaction-start') {
    entry.compaction = { reason: event.reason, startedAt: Date.now() }
    rt.emitStatus(agentId)
    rt.emitEvent(agentId, event)
    return
  }

  if (event.type === 'compaction-end') {
    entry.compaction = undefined
    rt.emitStatus(agentId)
    rt.emitEvent(agentId, event)
    return
  }

  if (event.type === 'auto-retry-start') {
    entry.retry = {
      attempt: event.attempt,
      maxAttempts: event.maxAttempts,
      delayMs: event.delayMs,
      errorMessage: event.errorMessage,
      startedAt: Date.now(),
    }
    rt.emitStatus(agentId)
    rt.emitEvent(agentId, event)
    return
  }

  if (event.type === 'auto-retry-end') {
    entry.retry = undefined
    rt.emitStatus(agentId)
    rt.emitEvent(agentId, event)
    return
  }

  // All other streaming events (text-delta, thinking-*,
  // tool-call-*, tool-execution-*, message-start/end,
  // image-attachment, branch-summary, log) — forward only.
  // The renderer is the sole owner of in-flight state.
  rt.emitEvent(agentId, event)
}
