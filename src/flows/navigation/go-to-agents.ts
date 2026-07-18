import type { NavigateFunction } from 'react-router-dom'

/**
 * Navigate to the agents list page.
 *
 * Matches the signature of `goBackHome` / `goToSettings` — the caller passes
 * the `navigate` function from `useNavigate()` so the flow stays
 * React-router-agnostic and easy to unit-test.
 */
export function goToAgents(navigate: NavigateFunction): void {
  navigate('/agents')
}
