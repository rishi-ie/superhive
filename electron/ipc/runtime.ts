import { ipcMain } from 'electron'
import { runtime } from '../manifest-pi-runtime'
import { AgentRepository } from '../../src/storage/repositories/AgentRepository'

export function registerRuntimeIpc(): void {
  ipcMain.handle('agents:start', async (_e, agentId: string) => {
    const agent = await AgentRepository.getById(agentId)
    if (!agent) throw new Error(`Agent not found: ${agentId}`)
    if (!agent.localPath) throw new Error(`Agent has no localPath: ${agentId}`)
    if (!agent.manifestPiSource) throw new Error(`Agent has no manifestPiSource: ${agentId}`)
    runtime.start(agentId, agent.localPath, agent.manifestPiSource)
    await AgentRepository.update(agentId, { status: 'initializing', lastError: undefined })
    return { ok: true }
  })

  ipcMain.handle('agents:stop', async (_e, agentId: string) => {
    runtime.stop(agentId)
    await AgentRepository.update(agentId, { status: 'stopped' })
    return { ok: true }
  })

  ipcMain.handle('agents:restart', async (_e, agentId: string) => {
    runtime.restart(agentId)
    await AgentRepository.update(agentId, { status: 'initializing', lastError: undefined })
    return { ok: true }
  })

  ipcMain.handle('agents:send', async (_e, agentId: string, message: string) => {
    const ok = runtime.send(agentId, message)
    return { ok }
  })

  ipcMain.handle('agents:getRuntimeState', (_e, agentId: string) => {
    const entry = runtime.getState(agentId)
    if (!entry) return null
    return {
      agentId: entry.agentId,
      status: entry.status,
      pid: entry.pid,
      startedAt: entry.startedAt,
      endedAt: entry.endedAt,
      lastError: entry.lastError,
      bootStep: entry.bootStep,
    }
  })
}