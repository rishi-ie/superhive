import { ipcMain } from 'electron'
import { TaskRepository } from '../../src/storage/repositories/TaskRepository'
import { IPC } from './index'
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
    return TaskRepository.create({
      title: data.title.trim(),
      description: data.description?.trim() || undefined,
      projectId: data.projectId,
      assignedAgentId: data.assignedAgentId,
    })
  })

  ipcMain.handle(IPC.TASKS.UPDATE, async (_e, id: string, patch: TaskUpdateInput): Promise<Task | null> => {
    return (await TaskRepository.update(id, patch)) ?? null
  })

  ipcMain.handle(IPC.TASKS.DELETE, async (_e, id: string): Promise<boolean> => {
    return TaskRepository.delete(id)
  })

  ipcMain.handle(IPC.TASKS.ASSIGN, async (_e, taskId: string, agentId: string | null): Promise<Task | null> => {
    await TaskRepository.assignAgent(taskId, agentId ?? undefined)
    return (await TaskRepository.getById(taskId)) ?? null
  })

  ipcMain.handle(IPC.TASKS.CHANGE_STATUS, async (_e, taskId: string, status: TaskStatus, outcome?: string): Promise<Task | null> => {
    return (await TaskRepository.changeStatus(taskId, status, { outcome })) ?? null
  })
}
