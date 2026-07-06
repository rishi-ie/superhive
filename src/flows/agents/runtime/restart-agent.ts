import { agents } from '@/api/agents'
import { toast } from 'sonner'

export async function restartAgent(agentId: string): Promise<{ ok: boolean }> {
  try {
    await agents.restart(agentId)
    toast.success('Agent restarting...')
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to restart'
    toast.error(message)
    return { ok: false }
  }
}
