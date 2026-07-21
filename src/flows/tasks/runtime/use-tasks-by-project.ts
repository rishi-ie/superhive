import * as React from 'react'
import { tasks as tasksApi } from '@/api/tasks'
import type { Task } from '@/storage/types'

/**
 * Returns the list of tasks for a project. Re-fetches on every
 * `tasks:changed` broadcast by the main process. Sorted in the
 * canonical display order: running, todo, blocked, completed, cancelled.
 *
 * Used by ProjectOverviewSection's "Active tasks" accordion. The
 * `tasks:changed` event is broadcast by the tasks-file-watcher
 * (db.tasks.json changes + plan/complete file ingest) and by every
 * IPC handler that mutates tasks directly.
 */
let tasksVersion = 0
const tasksListeners = new Set<() => void>()

export function useTasksVersion(): number {
  const [version, setVersion] = React.useState(tasksVersion)
  React.useEffect(() => {
    const off = tasksApi.onChanged(() => {
      tasksVersion += 1
      tasksListeners.forEach((l) => l())
    })
    const listener = () => setVersion(tasksVersion)
    tasksListeners.add(listener)
    return () => {
      tasksListeners.delete(listener)
      off()
    }
  }, [])
  return version
}

const STATUS_ORDER: Record<Task['status'], number> = {
  running: 0,
  todo: 1,
  blocked: 2,
  completed: 3,
  cancelled: 4,
}

export function sortTasksByStatus(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const sa = STATUS_ORDER[a.status] ?? 99
    const sb = STATUS_ORDER[b.status] ?? 99
    if (sa !== sb) return sa - sb
    return a.title.localeCompare(b.title)
  })
}

export function useTasksByProject(projectId: string | null | undefined): Task[] {
  const version = useTasksVersion()
  const [tasks, setTasks] = React.useState<Task[]>([])

  React.useEffect(() => {
    if (!projectId) {
      setTasks([])
      return
    }
    let cancelled = false
    tasksApi.list({ projectId }).then((rows) => {
      if (!cancelled) setTasks(rows)
    })
    return () => {
      cancelled = true
    }
  }, [projectId, version])

  return sortTasksByStatus(tasks)
}
