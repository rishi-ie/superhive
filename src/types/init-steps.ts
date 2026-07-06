import type { InitStep } from '@/types/electron'

export const INIT_STEPS: { id: InitStep; label: string }[] = [
  { id: 'installing-deps', label: 'Installing Manifest Pi' },
  { id: 'building-runtime', label: 'Building Pi runtime' },
  { id: 'generating-manifest', label: 'Generating default manifest' },
  { id: 'creating-workspace', label: 'Creating workspace' },
  { id: 'launching-runtime', label: 'Launching runtime' },
  { id: 'connecting-chat', label: 'Connecting chat' },
  { id: 'ready', label: 'Agent ready' },
]

export function matchBootStep(line: string): InitStep | null {
  const lower = line.toLowerCase()
  if (lower.includes('installing pi dependencies') || lower.includes('npm install')) {
    return 'installing-deps'
  }
  if (lower.includes('building pi workspace') || lower.includes('npm run build') || lower.includes('building')) {
    return 'building-runtime'
  }
  if (lower.includes('creating default manifest') || lower.includes('agent.json')) {
    return 'generating-manifest'
  }
  if (lower.includes('workspace') || lower.includes('creating workspace')) {
    return 'creating-workspace'
  }
  if (lower.includes('launching') || lower.includes('starting runtime')) {
    return 'launching-runtime'
  }
  if (lower.includes('connecting') || lower.includes('connecting chat')) {
    return 'connecting-chat'
  }
  return null
}