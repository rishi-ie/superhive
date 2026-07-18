import type { NavigateFunction } from 'react-router-dom'

/** Navigate to the remote page. */
export function goToRemote(navigate: NavigateFunction): void {
  navigate('/remote')
}
