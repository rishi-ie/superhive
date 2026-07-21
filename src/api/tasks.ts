import type { Task, TaskStatus, TaskCreateInput, TaskUpdateInput, TaskFilter } from '@/types/electron'

export const tasks = {
  list: (filter?: TaskFilter): Promise<Task[]> => window.api.tasks.list(filter),
  get: (id: string): Promise<Task | null> => window.api.tasks.get(id),
  create: (data: TaskCreateInput): Promise<Task> => window.api.tasks.create(data),
  update: (id: string, patch: TaskUpdateInput): Promise<Task | null> => window.api.tasks.update(id, patch),
  delete: (id: string): Promise<boolean> => window.api.tasks.delete(id),
  assign: (taskId: string, agentId: string | null): Promise<Task | null> => window.api.tasks.assign(taskId, agentId),
  changeStatus: (taskId: string, status: TaskStatus, outcome?: string): Promise<Task | null> => window.api.tasks.changeStatus(taskId, status, outcome),
  onChanged: (cb: () => void): (() => void) => window.api.tasks.onChanged(cb),
}
