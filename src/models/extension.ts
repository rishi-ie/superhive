/**
 * Declarative extension contract shared by the Manage UI and agent bootstrap.
 * Extensions contribute configuration and prompt fragments; Superhive owns
 * persistence, validation, and the active per-turn snapshot.
 */
export type AgentPreset = 'standard' | 'project_manager' | 'project_member'

export type ExtensionApplyMode = 'next_turn' | 'restart'

export interface ExtensionSetting {
  key: string
  label: string
  scope: 'agent' | 'project'
  apply: ExtensionApplyMode
  affectsSystemPrompt: boolean
}

export interface ExtensionDescriptor {
  id: string
  presets: AgentPreset[]
  defaultEnabled: boolean
  settings: ExtensionSetting[]
  contributesSystemPrompt: boolean
}
