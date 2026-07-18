import type { NavigateFunction } from 'react-router-dom'

/** Navigate to the projects list page. */
export function goToProjects(navigate: NavigateFunction): void {
  navigate('/projects')
}
