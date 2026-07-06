import type { ComponentType } from 'react'
import { HugeiconsIcon } from "@/components/ui/icon"
import { BotIcon, CpuIcon, SlidersHorizontalIcon, PackageIcon } from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"
import type { ReactNode } from "react"
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

type IconComp = (props: { className?: string }) => ReactNode;

function makeIcon(icon: IconSvgElement): IconComp {
  return function Icon({ className }: { className?: string }) {
    return <HugeiconsIcon icon={icon} className={className} />;
  };
}

export interface SettingsSectionDefinition {
  id: string
  label: string
  icon: IconComp
  readOnly: boolean
  order: number
  Component: ComponentType<SettingsSectionProps>
}

export const SETTING_SECTIONS: SettingsSectionDefinition[] = [
  { id: 'identity', label: 'Identity', icon: makeIcon(BotIcon), readOnly: false, order: 1, Component: IdentitySection },
  { id: 'model',    label: 'Model',   icon: makeIcon(CpuIcon), readOnly: false, order: 2, Component: ModelSection },
  { id: 'behavior', label: 'Behavior', icon: makeIcon(SlidersHorizontalIcon), readOnly: false, order: 3, Component: BehaviorSection },
  { id: 'skills',   label: 'Skills',  icon: makeIcon(PackageIcon), readOnly: true,  order: 4, Component: SkillsSection },
].sort((a, b) => a.order - b.order)
