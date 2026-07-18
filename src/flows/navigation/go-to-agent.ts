import type { NavigateFunction } from 'react-router-dom'

/** Navigate to a specific agent's chat surface. */
export function goToAgent(navigate: NavigateFunction, agentId: string): void {
  navigate(`/agents/${agentId}`)
}
