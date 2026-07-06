import { ipcMain } from 'electron'
import { mkdir, cp, writeFile, chmod } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import log from 'electron-log/main'
import { runtime } from '../manifest-pi-runtime'
import { AgentRepository } from '../../src/storage/repositories/AgentRepository'
import type { Agent, AgentStatus } from '../../src/storage/types'
import { IPC } from './index'
import { config } from '../config'

interface CreateAgentInput {
  name: string
  folderName: string
  parentDir: string
  manifestPiSource: string
  role?: string
  description?: string
}

export function registerAgentIpc(): void {
  ipcMain.handle(IPC.AGENTS.LIST, () => AgentRepository.getAll())

  ipcMain.handle(IPC.AGENTS.GET, async (_e, id: string) => {
    return (await AgentRepository.getById(id)) ?? null
  })

  ipcMain.handle(
    IPC.AGENTS.CREATE,
    async (_e, data: CreateAgentInput): Promise<Agent> => {
      if (!data.name?.trim()) throw new Error('Agent name is required')
      if (!data.folderName?.trim()) throw new Error('Agent folder name is required')
      if (!data.parentDir?.trim()) throw new Error('Parent directory is required')
      if (!data.manifestPiSource?.trim()) throw new Error('Manifest Pi source is required')

      const folderName = data.folderName.trim()
      const parentDir = data.parentDir.trim().replace(/^~(?=\/|$)/, process.env.HOME ?? '')
      const manifestPiSource = data.manifestPiSource.trim().replace(/^~(?=\/|$)/, process.env.HOME ?? '')

      if (!/^[a-z0-9][a-z0-9-]*$/.test(folderName)) {
        throw new Error('Folder name must be lowercase letters, digits, and hyphens (start with letter/digit)')
      }

      log.info(`[agents:create] ensuring parent dir ${parentDir}`)
      await mkdir(parentDir, { recursive: true })

      if (!existsSync(join(manifestPiSource, 'agent.sh'))) {
        throw new Error(`Manifest Pi source invalid (missing agent.sh): ${manifestPiSource}`)
      }

      const agentDir = join(parentDir, folderName)
      if (existsSync(agentDir)) {
        throw new Error(`Agent folder already exists: ${agentDir}`)
      }

      log.info(`[agents:create] creating agent dir ${agentDir}`)
      await mkdir(agentDir, { recursive: true })
      await cp(join(manifestPiSource, 'agent.sh'), join(agentDir, 'agent.sh'))
      await chmod(join(agentDir, 'agent.sh'), 0o755)

      const agent = await AgentRepository.create({
        name: data.name.trim(),
        role: data.role?.trim() || undefined,
        description: data.description?.trim() || undefined,
        localPath: agentDir,
        manifestPiSource,
        status: 'initializing',
      })

      await writeFile(join(agentDir, 'agent.json'), JSON.stringify({
        superhiveId: agent.id,
        version: 1,
        name: data.name.trim(),
        description: data.description?.trim() ?? '',
        workspace: './workspace',
        model: { provider: 'minimax', name: 'MiniMax-M2.7' },
        systemPrompt: '',
        environment: { MINIMAX_API_KEY: config.minimaxApiKey },
        skills: [],
        extensions: [],
        prompts: [],
        permissions: { filesystem: true, terminal: true, network: true },
        memory: {},
        context: {},
        logging: { enabled: true },
      }, null, 2) + '\n', 'utf8')
      await writeFile(join(agentDir, '.agent-initialized'), '', 'utf8')

      return agent
    }
  )

  ipcMain.handle(IPC.AGENTS.UPDATE_STATUS, async (_e, id: string, status: AgentStatus, lastError?: string) => {
    return AgentRepository.update(id, { status, lastError })
  })

  ipcMain.handle(IPC.AGENTS.DELETE, async (_e, id: string) => {
    const agent = await AgentRepository.getById(id)
    if (!agent) return false

    const status = runtime.getStatusPayload(id)
    if (status && status.status !== 'stopped' && status.status !== 'idle') {
      await runtime.stop(id)
    }

    const deleted = await AgentRepository.delete(id)
    if (!deleted) return false

    if (agent.localPath && existsSync(agent.localPath)) {
      log.info(`[agents:delete] removing ${agent.localPath}`)
      await rm(agent.localPath, { recursive: true, force: true })
    }
    return true
  })
}