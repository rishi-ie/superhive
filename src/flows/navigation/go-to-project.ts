import type { NavigateFunction } from 'react-router-dom'

/** Navigate to a specific project's chat surface. */
export function goToProject(navigate: NavigateFunction, projectId: string): void {
  navigate(`/projects/${projectId}`)
}
