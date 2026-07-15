import { agents } from '@/api/agents'
import { toast } from 'sonner'

export async function startAgent(agentId: string): Promise<{ ok: boolean }> {
	try {
		await agents.start(agentId)
		toast.success('Agent starting...')
		return { ok: true }
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to start'
		toast.error(message)
		return { ok: false }
	}
}
