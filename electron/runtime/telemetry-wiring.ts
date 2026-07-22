/**
 * Per-agent telemetry tailer wiring + equality helpers.
 *
 * Tails `<agentDir>/telemetry.jsonl` for the lifetime of one running
 * agent, normalises the wire event into `UsageSnapshot` / `ContextSnapshot`
 * / `ModelInfo[]` updates on the runtime entry, and persists auto-resolved
 * context windows back to the global `models` settings row.
 *
 * Scaffold-only stub. Filled in by the runtime split commit.
 */
import type { GeneralKaiRuntime } from '../general-kai-runtime'
import type { ContextSnapshot, ModelInfo, UsageSnapshot } from '../pi-protocol'
import type { RuntimeEntry } from '../runtime-status'

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

export function startTelemetryTailer(_rt: GeneralKaiRuntime, _entry: RuntimeEntry): void {
  throw new Error('not_implemented')
}

export function stopTelemetryTailer(_rt: GeneralKaiRuntime, _agentId: string): void {
  throw new Error('not_implemented')
}

export function handleTelemetryEvent(
  _rt: GeneralKaiRuntime,
  _agentId: string,
  _event: TelemetryWireEvent,
): void {
  throw new Error('not_implemented')
}

export function persistModelContextWindow(
  _rt: GeneralKaiRuntime,
  _provider: string,
  _name: string,
  _contextWindow: number,
): Promise<void> {
  throw new Error('not_implemented')
}

export function usageEquals(
  _a: UsageSnapshot | undefined,
  _b: UsageSnapshot,
): boolean {
  throw new Error('not_implemented')
}

export function contextUsageEquals(
  _a: ContextSnapshot | undefined,
  _b: ContextSnapshot,
): boolean {
  throw new Error('not_implemented')
}

export function modelsEqual(
  _a: ModelInfo[] | undefined,
  _b: ModelInfo[],
): boolean {
  throw new Error('not_implemented')
}
