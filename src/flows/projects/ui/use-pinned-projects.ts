import * as React from 'react'

const PINNED_PROJECTS_KEY = 'superhive.sidebar.pinned-project-ids'
const LEGACY_PINNED_AGENTS_KEY = 'superhive.sidebar.pinned-agent-ids'
const EMPTY_IDS: string[] = []

function readPinnedProjectIds(): string[] {
  if (typeof window === 'undefined') return EMPTY_IDS
  try {
    window.localStorage.removeItem(LEGACY_PINNED_AGENTS_KEY)
    const value = JSON.parse(window.localStorage.getItem(PINNED_PROJECTS_KEY) ?? '[]')
    return Array.isArray(value)
      ? value.filter((id): id is string => typeof id === 'string')
      : EMPTY_IDS
  } catch {
    return EMPTY_IDS
  }
}

let pinnedProjectIds = readPinnedProjectIds()
const listeners = new Set<() => void>()

export function getPinnedProjectIds(): string[] {
  return pinnedProjectIds
}

export function subscribePinnedProjects(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function togglePinnedProject(projectId: string): void {
  pinnedProjectIds = pinnedProjectIds.includes(projectId)
    ? pinnedProjectIds.filter((id) => id !== projectId)
    : [...pinnedProjectIds, projectId]
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(PINNED_PROJECTS_KEY, JSON.stringify(pinnedProjectIds))
  }
  listeners.forEach((listener) => listener())
}

export function usePinnedProjects() {
  const ids = React.useSyncExternalStore(
    subscribePinnedProjects,
    getPinnedProjectIds,
    () => EMPTY_IDS,
  )
  return {
    pinnedProjectIds: ids,
    toggleProjectPin: togglePinnedProject,
  }
}
