export interface AgentSettingsState {
  name?: string
  description?: string
  model?: { provider: string; name: string }
  systemPrompt?: string
  permissions?: { filesystem?: boolean; terminal?: boolean; network?: boolean }
  runtime?: { thinkingLevel?: string; activeTools?: string[] }
  catalog?: { skills?: Array<{ path: string; active: boolean }>; extensions?: Array<{ path: string; active: boolean }>; prompts?: Array<{ path: string; active: boolean }> }
  sessionsIndex?: { sessions: Array<{ id: string; name?: string; messageCount: number; cost: number; path: string }> }
  [k: string]: unknown
}

export { useAgentSettings } from './use-agent-settings'
export { updateAgentSettings } from './update-agent-settings'
