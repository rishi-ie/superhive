import { agents } from '@/api/agents'
import { toast } from 'sonner'

export async function stopAgent(agentId: string): Promise<{ ok: boolean }> {
  try {
    await agents.stop(agentId)
    toast.success('Agent stopped')
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to stop'
    toast.error(message)
    return { ok: false }
  }
}
