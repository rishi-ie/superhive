/**
 * Per-agent settings-file fs-watcher.
 *
 * Watches `<agentDir>/Superhive-pi-<basename>.json` for external writes
 * (Tier 1 / Tier 2 settings changes), debounces 100ms, parses
 * `managedBy` counter, and emits `agent:<id>:settings-changed` only
 * when the on-disk counter strictly exceeds the last seen.
 *
 * Scaffold-only stub. Filled in by the runtime split commit.
 */
import type { GeneralKaiRuntime } from '../general-kai-runtime'

export function ensureSettingsWatcher(
  _rt: GeneralKaiRuntime,
  _agentId: string,
  _settingsPath: string,
): void {
  throw new Error('not_implemented')
}

export function closeSettingsWatcher(_rt: GeneralKaiRuntime, _agentId: string): void {
  throw new Error('not_implemented')
}

export function closeAllSettingsWatchers(_rt: GeneralKaiRuntime): void {
  throw new Error('not_implemented')
}

export function markSelfWrite(_rt: GeneralKaiRuntime, _agentId: string, _counter: number): void {
  throw new Error('not_implemented')
}
