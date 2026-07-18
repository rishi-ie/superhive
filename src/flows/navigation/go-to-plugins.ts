import type { NavigateFunction } from 'react-router-dom'

/** Navigate to the plugins page. */
export function goToPlugins(navigate: NavigateFunction): void {
  navigate('/plugins')
}
