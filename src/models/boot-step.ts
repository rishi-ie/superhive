export type InitStep =
  | 'installing-deps'
  | 'building-runtime'
  | 'generating-manifest'
  | 'creating-workspace'
  | 'launching-runtime'
  | 'connecting-chat'
  | 'ready'

export const INIT_STEPS: { id: InitStep; label: string }[] = [
  { id: 'installing-deps', label: 'Installing Manifest Pi' },
  { id: 'building-runtime', label: 'Building Pi runtime' },
  { id: 'generating-manifest', label: 'Generating default manifest' },
  { id: 'creating-workspace', label: 'Creating workspace' },
  { id: 'launching-runtime', label: 'Launching runtime' },
  { id: 'connecting-chat', label: 'Connecting chat' },
  { id: 'ready', label: 'Agent ready' },
]

export type AdapterEvent =
  | { type: 'text-delta'; messageId: string; delta: string }
  | { type: 'message-start'; messageId: string; role: 'user' | 'assistant' }
  | { type: 'message-end'; messageId: string }
  | { type: 'boot-step'; step: InitStep }
  | { type: 'ready' }
  | { type: 'log'; stream: 'stdout' | 'stderr'; line: string }
  | { type: 'error'; message: string; recoverable: boolean }
