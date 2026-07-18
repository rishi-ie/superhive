import { disposeRuntimeSliceNow } from '@/flows/agents/runtime'
import { disposeSettingsSliceNow } from './agent-settings-slice'

/**
 * Combined dispose — wipes the runtime slice (queue + IPC subs) AND the
 * settings slice for one agent. Used by `delete-agent` / `delete-project`
 * flows after the agent row is removed.
 *
 * Lifted from `src/stores/agent.ts::disposeSlice`. Behavior is identical:
 * `disposeRuntimeSliceNow(agentId)` + `disposeSettingsSliceNow(agentId)`.
 */
export function disposeSlice(agentId: string): void {
  disposeRuntimeSliceNow(agentId)
  disposeSettingsSliceNow(agentId)
}
