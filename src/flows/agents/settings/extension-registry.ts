import type { AgentPreset, ExtensionDescriptor } from '@/models/extension'

/** The one registry used to decide default assignment and runtime semantics.
 * New extensions are added here instead of adding scattered role checks. */
export const EXTENSION_REGISTRY: readonly ExtensionDescriptor[] = [
  {
    id: 'superhive-pi-truth',
    presets: ['standard', 'project_manager', 'project_member'],
    defaultEnabled: true,
    settings: [],
    contributesSystemPrompt: false,
  },
  {
    id: 'superhive-pi-telemetry',
    presets: ['standard', 'project_manager', 'project_member'],
    defaultEnabled: true,
    settings: [],
    contributesSystemPrompt: false,
  },
  {
    id: 'superhive-pi-context',
    presets: ['project_manager'],
    defaultEnabled: true,
    settings: [],
    contributesSystemPrompt: true,
  },
  {
    id: 'superhive-pi-orchestration',
    presets: ['project_manager', 'project_member'],
    defaultEnabled: true,
    settings: [],
    contributesSystemPrompt: true,
  },
  {
    id: 'superhive-pi-plan',
    presets: ['project_manager'],
    defaultEnabled: true,
    settings: [
      {
        key: 'planMode',
        label: 'Plan mode',
        scope: 'agent',
        apply: 'next_turn',
        affectsSystemPrompt: true,
      },
    ],
    contributesSystemPrompt: true,
  },
] as const

export function extensionIdsForPreset(preset: AgentPreset): string[] {
  return EXTENSION_REGISTRY
    .filter((extension) => extension.defaultEnabled && extension.presets.includes(preset))
    .map((extension) => extension.id)
}

export function getExtensionDescriptor(id: string): ExtensionDescriptor | undefined {
  return EXTENSION_REGISTRY.find((extension) => extension.id === id)
}
