/**
 * AdapterEvent dispatch. Maps each of the 22 `AdapterEvent` variants
 * emitted by `pi-protocol/raw-text-adapter` onto runtime side-effects
 * (status transitions, broadcasts, in-memory state mutations).
 *
 * Scaffold-only stub. Filled in by the runtime split commit.
 */
import type { GeneralKaiRuntime } from '../general-kai-runtime'
import type { AdapterEvent } from '../pi-protocol'

export function handleAdapterEvent(
  _rt: GeneralKaiRuntime,
  _agentId: string,
  _event: AdapterEvent,
): void {
  throw new Error('not_implemented')
}
