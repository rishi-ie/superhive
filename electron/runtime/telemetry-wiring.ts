/**
 * Per-agent telemetry tailer wiring + equality helpers.
 *
 * Tails `<agentDir>/telemetry.jsonl` for the lifetime of one running
 * agent, normalises the wire event into `UsageSnapshot` / `ContextSnapshot`
 * / `ModelInfo[]` updates on the runtime entry, and persists auto-resolved
 * context windows back to the global `models` settings row.
 *
 * If the journal never appears within `TAILER_AUTO_STOP_MS`, the tailer
 * self-stops (the extension isn't installed or never wrote telemetry).
 */
import { join } from 'node:path'
import log from 'electron-log/main'
import { TelemetryTailer } from '../pi-protocol/telemetry-tailer'
import type { ContextSnapshot, ModelInfo, UsageSnapshot } from '../pi-protocol'
import type { RuntimeEntry } from '../runtime-status'
import type { GeneralKaiRuntime } from '../general-kai-runtime'
import { IPC } from '../ipc/index'
import { SettingsRepository } from '../../src/storage/repositories/SettingsRepository'

const TAILER_AUTO_STOP_MS = 30_000

export type TelemetryWireEvent = {
  type: string
  usage?: UsageSnapshot
  tokens?: number | null
  contextWindow?: number
  percent?: number | null
  event?: string
  provider?: string
  id?: string
  name?: string
  [k: string]: unknown
}

export function startTelemetryTailer(rt: GeneralKaiRuntime, entry: RuntimeEntry): void {
  if (rt.telemetryTailers.has(entry.agentId)) return
  const journalPath = join(entry.agentDir, 'telemetry.jsonl')
  const tailer = new TelemetryTailer(journalPath, (ev) =>
    rt.handleTelemetryEvent(entry.agentId, ev as TelemetryWireEvent),
  )
  tailer.start()
  rt.telemetryTailers.set(entry.agentId, tailer)
  setTimeout(() => {
    const t = rt.telemetryTailers.get(entry.agentId)
    if (t === tailer) {
      log.info(`[runtime] telemetry journal never appeared for ${entry.agentId}; stopping tailer`)
      rt.stopTelemetryTailer(entry.agentId)
    }
  }, TAILER_AUTO_STOP_MS)
}

export function stopTelemetryTailer(rt: GeneralKaiRuntime, agentId: string): void {
  const tailer = rt.telemetryTailers.get(agentId)
  if (!tailer) return
  tailer.stop()
  rt.telemetryTailers.delete(agentId)
}

export function handleTelemetryEvent(
  rt: GeneralKaiRuntime,
  agentId: string,
  event: TelemetryWireEvent,
): void {
  const entry = rt.entries.get(agentId)
  if (!entry) return
  if (event.type === 'usage' && event.usage && typeof event.usage === 'object') {
    const next = event.usage as UsageSnapshot
    if (rt.usageEquals(entry.usage, next)) return
    entry.usage = next
    rt.emitStatus(agentId)
    return
  }
  if (event.type === 'context') {
    const tokens = typeof event.tokens === 'number' ? event.tokens : null
    const contextWindow = typeof event.contextWindow === 'number' ? event.contextWindow : 0
    const percent = typeof event.percent === 'number' ? event.percent : null
    const next: ContextSnapshot = { tokens, contextWindow, percent }
    if (rt.contextUsageEquals(entry.contextUsage, next)) return
    entry.contextUsage = next
    rt.emitStatus(agentId)
    return
  }
  if (event.type === 'models' && Array.isArray(event.models)) {
    const next = event.models as ModelInfo[]
    if (rt.modelsEqual(entry.availableModels, next)) return
    entry.availableModels = next
    rt.emitStatus(agentId)
    return
  }
  if (event.type === 'model') {
    const contextWindow =
      typeof event.contextWindow === 'number' && event.contextWindow > 0
        ? event.contextWindow
        : undefined
    const name = typeof event.name === 'string' ? event.name : undefined
    const provider = typeof event.provider === 'string' ? event.provider : undefined
    if (
      entry.activeModelContextWindow === contextWindow &&
      entry.activeModelName === name &&
      entry.activeModelProvider === provider
    ) return
    entry.activeModelContextWindow = contextWindow
    entry.activeModelName = name
    entry.activeModelProvider = provider
    rt.emitStatus(agentId)
    if (typeof event.provider === 'string' && name && typeof contextWindow === 'number') {
      rt.persistModelContextWindow(event.provider, name, contextWindow)
    }
    return
  }
}

export async function persistModelContextWindow(
  rt: GeneralKaiRuntime,
  provider: string,
  name: string,
  contextWindow: number,
): Promise<void> {
  try {
    const id = `${provider}:${name}`
    const row = await SettingsRepository.getSetting('global', 'global', id)
    if (!row) return
    const value = row.value as { contextWindow?: number } | undefined
    if (typeof value?.contextWindow === 'number' && value.contextWindow > 0) return
    await SettingsRepository.setSetting(
      'global',
      'global',
      id,
      { ...(value ?? {}), id, provider, name, enabled: true, isCustom: true, contextWindow },
      'json',
      name,
      undefined,
      'models',
    )
    const win = rt.getWindow()
    if (win && !win.isDestroyed()) {
      win.webContents.send(IPC.SETTINGS.ON_MODEL_UPDATED, { id, provider, name, contextWindow })
    }
    log.info(`[runtime] auto-resolved contextWindow for ${id} = ${contextWindow}`)
  } catch (err) {
    log.warn(`[runtime] failed to persist model contextWindow for ${provider}:${name}:`, err)
  }
}

export function usageEquals(a: UsageSnapshot | undefined, b: UsageSnapshot): boolean {
  if (!a) return false
  return (
    a.input === b.input &&
    a.output === b.output &&
    a.cacheRead === b.cacheRead &&
    a.cacheWrite === b.cacheWrite &&
    a.totalTokens === b.totalTokens
  )
}

export function contextUsageEquals(a: ContextSnapshot | undefined, b: ContextSnapshot): boolean {
  if (!a) return false
  return (
    a.tokens === b.tokens &&
    a.contextWindow === b.contextWindow &&
    a.percent === b.percent
  )
}

export function modelsEqual(a: ModelInfo[] | undefined, b: ModelInfo[]): boolean {
  if (!a) return false
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    const x = a[i]
    const y = b[i]
    if (!x || !y) return false
    if (
      x.provider !== y.provider ||
      x.id !== y.id ||
      x.name !== y.name ||
      x.contextWindow !== y.contextWindow ||
      x.maxTokens !== y.maxTokens
    ) {
      return false
    }
  }
  return true
}
