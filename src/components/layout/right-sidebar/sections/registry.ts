import type { ComponentType } from 'react'
import { Bot, Cpu, Sliders, Boxes } from 'lucide-react'
import { IdentitySection } from './IdentitySection'
import { ModelSection } from './ModelSection'
import { BehaviorSection } from './BehaviorSection'
import { SkillsSection } from './SkillsSection'
import type { AgentSettingsState } from '@/flows/agents/settings'

export interface SettingsSectionProps {
  settings: AgentSettingsState
  agentId: string
  patch: (key: string, value: unknown) => void
  flush: (p: Record<string, unknown>) => Promise<void>
}

export interface SettingsSectionDefinition {
  id: string
  label: string
  icon: ComponentType<{ className?: string }>
  readOnly: boolean
  order: number
  Component: ComponentType<SettingsSectionProps>
}

export const SETTING_SECTIONS: SettingsSectionDefinition[] = [
  { id: 'identity', label: 'Identity', icon: Bot, readOnly: false, order: 1, Component: IdentitySection },
  { id: 'model',    label: 'Model',   icon: Cpu, readOnly: false, order: 2, Component: ModelSection },
  { id: 'behavior', label: 'Behavior', icon: Sliders, readOnly: false, order: 3, Component: BehaviorSection },
  { id: 'skills',   label: 'Skills',  icon: Boxes, readOnly: true,  order: 4, Component: SkillsSection },
].sort((a, b) => a.order - b.order)
