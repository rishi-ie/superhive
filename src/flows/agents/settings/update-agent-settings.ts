import { agents } from '@/api/agents'
import { toast } from 'sonner'
import type { AgentSettingsState, UpdateAgentSettingsInput } from '@/models/agent'

export async function updateAgentSettings(input: UpdateAgentSettingsInput): Promise<{ ok: boolean; settings?: AgentSettingsState }> {
  try {
    const settings = await agents.writeSettings(input.agentId, input.patch as Record<string, unknown>)
    toast.success('Settings saved')
    return { ok: true, settings: settings as AgentSettingsState }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save settings'
    toast.error(message)
    return { ok: false }
  }
}
