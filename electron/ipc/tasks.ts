import { ipcMain } from 'electron'
import { TaskRepository } from '../../src/storage/repositories/TaskRepository'
import { IPC } from './index'
import { tasksFileWatcher } from '../tasks-file-watcher'
import type { Task, TaskStatus, TaskCreateInput, TaskUpdateInput, TaskFilter } from '../../src/types/electron'

export function registerTaskIpc(): void {
  ipcMain.handle(IPC.TASKS.LIST, async (_e, filter?: TaskFilter): Promise<Task[]> => {
    const all = await TaskRepository.getAll()
    if (!filter) return all
    return all.filter((t) => {
      if (filter.projectId && t.projectId !== filter.projectId) return false
      if (filter.agentId && t.assignedAgentId !== filter.agentId) return false
      if (filter.status && t.status !== filter.status) return false
      return true
    })
  })

  ipcMain.handle(IPC.TASKS.GET, async (_e, id: string): Promise<Task | null> => {
    return (await TaskRepository.getById(id)) ?? null
  })

  ipcMain.handle(IPC.TASKS.CREATE, async (_e, data: TaskCreateInput): Promise<Task> => {
    if (!data.title?.trim()) throw new Error('Task title is required')
    if (!data.projectId?.trim()) throw new Error('Task projectId is required')
    const task = await TaskRepository.create({
      title: data.title.trim(),
      description: data.description?.trim() || undefined,
      projectId: data.projectId,
      assignedAgentId: data.assignedAgentId,
    })
    tasksFileWatcher.notifyChanged()
    return task
  })

  ipcMain.handle(IPC.TASKS.UPDATE, async (_e, id: string, patch: TaskUpdateInput): Promise<Task | null> => {
    const updated = await TaskRepository.update(id, patch)
    if (updated) tasksFileWatcher.notifyChanged()
    return updated ?? null
  })

  ipcMain.handle(IPC.TASKS.DELETE, async (_e, id: string): Promise<boolean> => {
    const ok = await TaskRepository.delete(id)
    if (ok) tasksFileWatcher.notifyChanged()
    return ok
  })

  ipcMain.handle(IPC.TASKS.ASSIGN, async (_e, taskId: string, agentId: string | null): Promise<Task | null> => {
    await TaskRepository.assignAgent(taskId, agentId ?? undefined)
    const task = await TaskRepository.getById(taskId)
    if (task) tasksFileWatcher.notifyChanged()
    return task ?? null
  })

  ipcMain.handle(IPC.TASKS.CHANGE_STATUS, async (_e, taskId: string, status: TaskStatus, outcome?: string): Promise<Task | null> => {
    const updated = await TaskRepository.changeStatus(taskId, status, { outcome })
    if (updated) tasksFileWatcher.notifyChanged()
    return updated ?? null
  })
}
