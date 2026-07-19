import * as React from 'react'
import { projects } from '@/api/projects'

/**
 * Returns a monotonic version counter that bumps on every `projects:changed`
 * event broadcast by the main process (after each IPC handler that mutates
 * db.projects.json). Components include `version` in their effect deps to
 * re-fetch the projects list on every DB change without polling.
 *
 * Mirrors `useAgentsListVersion` exactly — same pub-sub module-scoped
 * state, same listener lifecycle, same cleanup on unmount.
 */
let projectsListVersion = 0
const projectsListListeners = new Set<() => void>()

export function useProjectsListVersion(): number {
  const [version, setVersion] = React.useState(projectsListVersion)
  React.useEffect(() => {
    const off = projects.onChanged(() => {
      projectsListVersion += 1
      projectsListListeners.forEach((l) => l())
    })
    const listener = () => setVersion(projectsListVersion)
    projectsListListeners.add(listener)
    return () => {
      projectsListListeners.delete(listener)
      off()
    }
  }, [])
  return version
}
