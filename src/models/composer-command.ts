export type ComposerCommandMenu = 'slash' | 'at'
export type ComposerCommandAction = 'skill' | 'plugin' | 'mode' | 'goal' | 'attachment'
export type ComposerCommandSource = 'skills' | 'plugins'

export interface ComposerCommandItem {
  id: string
  label?: string
  description?: string
  keywords?: string[]
  action?: ComposerCommandAction
  value?: string
  source?: ComposerCommandSource
}

export interface ComposerCommandFile {
  version: 1
  items: ComposerCommandItem[]
}

export interface ComposerCommandFiles {
  slash: ComposerCommandFile
  at: ComposerCommandFile
}
