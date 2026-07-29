import type {
  LoopTaskStatus,
  ProjectPlanTaskV1,
} from '../../src/orchestration/domain/entities'
import type {
  ProjectTaskProjection,
  TaskProjection,
} from '../../src/orchestration/ports'
import { TaskRepository } from '../../src/storage/repositories/TaskRepository'
import type { Task } from '../../src/storage/types'

function project(row: Task): ProjectTaskProjection {
  return {
    id: row.id,
    projectId: row.projectId,
    planId: row.planId,
    status: row.status as LoopTaskStatus,
    dependencies: row.dependencies,
    assignedAgentId: row.assignedAgentId,
    currentIterationId: row.currentIterationId,
    acceptedIterationId: row.acceptedIterationId,
    iterationCount: row.iterationCount ?? 0,
  }
}

export class LowdbTaskProjection implements TaskProjection {
  async createPlanTasks(
    projectId: string,
    planId: string,
    input: Array<Omit<ProjectPlanTaskV1, 'id'>>,
  ): Promise<ProjectPlanTaskV1[]> {
    const created = new Map<string, Task>()
    for (const task of input) {
      const row = await TaskRepository.create({
        title: task.title,
        description: task.objective,
        projectId,
        assignedAgentId: task.preferredWorkerAgentId,
        context: undefined,
        planId,
        objective: task.objective,
        deliverables: task.deliverables,
        definitionOfDone: task.definitionOfDone,
        iterationCount: 0,
      })
      created.set(task.key, row)
    }
    const tasks: ProjectPlanTaskV1[] = []
    for (const task of input) {
      const row = created.get(task.key)!
      const dependencies = task.dependencies.map((key) => {
        const dependency = created.get(key)
        if (!dependency) throw new Error(`Unknown dependency key: ${key}`)
        return dependency.id
      })
      await TaskRepository.update(row.id, { dependencies })
      tasks.push({ ...task, id: row.id, dependencies })
    }
    return tasks
  }

  async get(taskId: string) {
    const row = await TaskRepository.getById(taskId)
    return row ? project(row) : null
  }

  async list(projectId: string) {
    return (await TaskRepository.getByProject(projectId)).map(project)
  }

  async assignIteration(taskId: string, workerAgentId: string, iterationId: string) {
    const row = await TaskRepository.getById(taskId)
    if (!row) throw new Error(`Task not found: ${taskId}`)
    await TaskRepository.assignAgent(taskId, workerAgentId)
    await TaskRepository.update(taskId, {
      status: 'running',
      currentIterationId: iterationId,
      iterationCount: (row.iterationCount ?? 0) + 1,
      staleSince: undefined,
    })
  }

  async changeStatus(
    taskId: string,
    status: LoopTaskStatus,
    patch: Partial<ProjectTaskProjection> = {},
  ) {
    await TaskRepository.update(taskId, {
      status,
      assignedAgentId: patch.assignedAgentId,
      currentIterationId: patch.currentIterationId,
      acceptedIterationId: patch.acceptedIterationId,
      iterationCount: patch.iterationCount,
      dependencies: patch.dependencies,
    })
  }
}

