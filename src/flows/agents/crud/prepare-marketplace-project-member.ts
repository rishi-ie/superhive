import { agents } from '@/api/agents'
import { waitForAgentReady } from './wait-for-agent-ready'
import type { Agent } from '@/types/electron'

export async function prepareMarketplaceProjectMember(input: {
  profileId: 'general-worker'
  projectId: string
  name: string
  role: string
}): Promise<{ ok: true; agent: Agent } | { ok: false; message: string }> {
  let agentId: string
  try {
    const result = await agents.provisionMarketplaceMember(input)
    agentId = result.agentId
    const start = await agents.start(agentId)
    if (!start.ok) throw new Error('Worker runtime failed to start')
    const ready = await waitForAgentReady(agentId)
    if (!ready.ok) throw new Error(ready.message ?? 'Worker runtime did not finish booting')
    const agent = await agents.get(agentId)
    if (!agent) throw new Error('Worker was prepared but could not be loaded')
    return { ok: true, agent }
  } catch (error) {
    if (agentId!) await agents.delete(agentId).catch(() => {})
    return { ok: false, message: error instanceof Error ? error.message : 'Could not add the worker to this project' }
  }
}
