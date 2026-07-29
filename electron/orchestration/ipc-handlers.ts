import { ipcMain } from 'electron'
import { selectWorkerSnapshot } from '../../src/orchestration/application'
import { AgentRepository } from '../../src/storage/repositories/AgentRepository'
import { ORCHESTRATION_CHANNELS } from './electron-notifier'
import { orchestrationService, orchestrationStores } from './orchestration-container'

export const ORCHESTRATION_IPC = {
  GET_PROJECT: 'orchestration:get-project',
  GET_AGENT: 'orchestration:get-agent',
  LIST_PLANS: 'orchestration:list-plans',
  GET_ITERATION: 'orchestration:get-iteration',
  LIST_MESSAGES: 'orchestration:list-messages',
  APPROVE_PLAN: 'orchestration:approve-plan',
  PAUSE_PROJECT: 'orchestration:pause-project',
  RESUME_PROJECT: 'orchestration:resume-project',
  CANCEL_PROJECT: 'orchestration:cancel-project',
} as const

export function registerOrchestrationIpc(): void {
  ipcMain.handle(ORCHESTRATION_IPC.GET_PROJECT, async (_event, projectId: string) =>
    orchestrationService.getProjectSnapshot(projectId))
  ipcMain.handle(ORCHESTRATION_IPC.GET_AGENT, async (_event, agentId: string) => {
    const agent = await AgentRepository.getById(agentId)
    const projectId = agent?.projectIds[0]
    if (!projectId) return null
    return selectWorkerSnapshot(await orchestrationService.getProjectSnapshot(projectId), agentId)
  })
  ipcMain.handle(ORCHESTRATION_IPC.LIST_PLANS, (_event, projectId: string) =>
    orchestrationStores.recordStore.listPlans(projectId))
  ipcMain.handle(ORCHESTRATION_IPC.GET_ITERATION, async (_event, projectId: string, iterationId: string) => {
    const iteration = (await orchestrationService.getProjectSnapshot(projectId)).iterations[iterationId]
    if (!iteration) return null
    return {
      iteration,
      packet: await orchestrationStores.recordStore.readPacket(projectId, iterationId),
      result: await orchestrationStores.recordStore.readResult(projectId, iterationId),
      review: await orchestrationStores.recordStore.readReview(projectId, iterationId),
    }
  })
  ipcMain.handle(ORCHESTRATION_IPC.LIST_MESSAGES, async (_event, projectId: string) =>
    (await orchestrationStores.conversationStore.list(projectId)).messages)
  ipcMain.handle(ORCHESTRATION_IPC.APPROVE_PLAN, (_event, projectId: string, planId: string) =>
    orchestrationService.approvePlan(projectId, planId))
  ipcMain.handle(ORCHESTRATION_IPC.PAUSE_PROJECT, (_event, projectId: string) =>
    orchestrationService.pauseProject(projectId))
  ipcMain.handle(ORCHESTRATION_IPC.RESUME_PROJECT, (_event, projectId: string) =>
    orchestrationService.resumeProject(projectId))
  ipcMain.handle(ORCHESTRATION_IPC.CANCEL_PROJECT, (_event, projectId: string) =>
    orchestrationService.cancelProject(projectId))
}

export { ORCHESTRATION_CHANNELS }

