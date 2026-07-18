import type { NavigateFunction } from 'react-router-dom'

/** Navigate to the meta-hive page. */
export function goToHive(navigate: NavigateFunction): void {
  navigate('/hive')
}
