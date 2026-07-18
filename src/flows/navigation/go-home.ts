import type { NavigateFunction } from 'react-router-dom'

/** Navigate to the root (landing) page. */
export function goHome(navigate: NavigateFunction): void {
  navigate('/')
}
