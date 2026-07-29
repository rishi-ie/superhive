import type { OrchestrationDependencies } from './orchestration-service'

export class RecoveryService {
  constructor(private readonly deps: OrchestrationDependencies) {}

  async recoverProject(projectId: string): Promise<void> {
    const snapshot = await this.deps.snapshotStore.read(projectId)
    if (!snapshot) return
    for (const iterationId of snapshot.activeIterationIds) {
      const iteration = snapshot.iterations[iterationId]
      if (!iteration || !iteration.policySnapshot.recovery.resumeSameIterationAfterRestart) continue
      await this.deps.wakeQueue.enqueue({
        id: `recover:${iteration.id}`,
        agentId: iteration.workerAgentId,
        reason: 'resume_after_restart',
        projectId,
        taskId: iteration.taskId,
        iterationId: iteration.id,
      })
    }
    if (
      snapshot.state === 'running'
      && snapshot.activeIterationIds.length === 0
      && snapshot.queuedTaskIds.length > 0
    ) {
      const coordinator = await this.deps.agents.coordinator(projectId)
      if (coordinator) {
        await this.deps.wakeQueue.enqueue({
          id: `recover:coordinator:${projectId}:${snapshot.lastAppliedSequence}`,
          agentId: coordinator.id,
          reason: 'resume_after_restart',
          projectId,
        })
      }
    }
  }
}
