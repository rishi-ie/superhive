import * as React from 'react'
import { agents } from '@/api/agents'

/**
 * Returns a monotonic version counter that bumps on every `agents:changed`
 * event. Components include `version` in their effect deps to re-fetch
 * the agents list on every DB change without polling.
 *
 * Lifted from `src/stores/agent.ts`. Behavior is identical: subscribes
 * once per mount, cleans up on unmount, listeners receive the new version
 * counter via a small pub-sub.
 */
let agentsListVersion = 0
const agentsListListeners = new Set<() => void>()

export function useAgentsListVersion(): number {
  const [version, setVersion] = React.useState(agentsListVersion)
  React.useEffect(() => {
    const off = agents.onChanged(() => {
      agentsListVersion += 1
      agentsListListeners.forEach((l) => l())
    })
    const listener = () => setVersion(agentsListVersion)
    agentsListListeners.add(listener)
    return () => {
      agentsListListeners.delete(listener)
      off()
    }
  }, [])
  return version
}
