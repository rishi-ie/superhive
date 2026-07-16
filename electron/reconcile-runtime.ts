import log from 'electron-log/main'
import { AgentRepository } from '../src/storage/repositories/AgentRepository'
import { runtime } from './general-kai-runtime'
import type { AgentStatus } from '../src/storage/types'

const LIVE_STATUSES: AgentStatus[] = ['active', 'busy', 'waiting']

export async function reconcileRuntime(): Promise<void> {
  log.info('[reconcile-runtime] starting')

  const dbAgents = await AgentRepository.getAll()
  let reconciled = 0

  for (const agent of dbAgents) {
    if (!agent.localPath) continue

    const runtimePayload = runtime.getStatusPayload(agent.id)
    const isLive = runtimePayload !== null

    if (!isLive && LIVE_STATUSES.includes(agent.status)) {
      await AgentRepository.update(agent.id, {
        status: 'idle',
        lastError: undefined,
      })
      reconciled++
      log.info(`[reconcile-runtime] ${agent.name} (${agent.id}): ${agent.status} → idle (no runtime entry)`)
    }
  }

  log.info(`[reconcile-runtime] done — reconciled=${reconciled}`)
}
