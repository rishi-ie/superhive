import { ipcMain } from 'electron'
import { runtime } from '../manifest-pi-runtime'
import { AgentRepository } from '../../src/storage/repositories/AgentRepository'
import { IPC } from './index'
import { TEMPLATE_DIR } from '../install-bootstrap'

export function registerRuntimeIpc(): void {
  ipcMain.handle(IPC.AGENTS.START, async (_e, agentId: string) => {
    const agent = await AgentRepository.getById(agentId)
    if (!agent) throw new Error(`Agent not found: ${agentId}`)
    if (!agent.localPath) throw new Error(`Agent has no localPath: ${agentId}`)
    runtime.start(agentId, agent.localPath, TEMPLATE_DIR)
    await AgentRepository.update(agentId, { status: 'initializing', lastError: undefined })
    return { ok: true }
  })

  ipcMain.handle(IPC.AGENTS.STOP, async (_e, agentId: string) => {
    runtime.stop(agentId)
    await AgentRepository.update(agentId, { status: 'stopped' })
    return { ok: true }
  })

  ipcMain.handle(IPC.AGENTS.RESTART, async (_e, agentId: string) => {
    runtime.restart(agentId)
    await AgentRepository.update(agentId, { status: 'initializing', lastError: undefined })
    return { ok: true }
  })

  ipcMain.handle(IPC.AGENTS.SEND, async (_e, agentId: string, message: string) => {
    const ok = runtime.send(agentId, message)
    return { ok }
  })

  ipcMain.handle(IPC.AGENTS.GET_RUNTIME_STATE, (_e, agentId: string) => {
    return runtime.getStatusPayload(agentId)
  })
}