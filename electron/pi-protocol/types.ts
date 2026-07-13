export type InitStep =
  | 'installing-deps'
  | 'building-runtime'
  | 'generating-manifest'
  | 'creating-workspace'
  | 'launching-runtime'
  | 'connecting-chat'
  | 'ready'

export interface UsageSnapshot {
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
  totalTokens: number
}

export interface ContextSnapshot {
  tokens: number | null
  contextWindow: number
  percent: number | null
}

export interface ModelInfo {
  provider: string
  id: string
  name: string
  contextWindow: number
  maxTokens: number
}

export type AdapterEvent =
  | { type: 'text-delta'; messageId: string; delta: string }
  | { type: 'message-start'; messageId: string; role: 'user' | 'assistant' }
  | { type: 'message-end'; messageId: string }
  | { type: 'thinking-start'; messageId: string; contentIndex: number }
  | { type: 'boot-step'; step: InitStep }
  | { type: 'ready' }
  | { type: 'log'; stream: 'stdout' | 'stderr'; line: string }
  | { type: 'error'; message: string; recoverable: boolean }
  | { type: 'usage'; usage: UsageSnapshot }

/**
 * Contract for a Pi protocol I/O adapter.
 * Parses stdout/stderr chunks from the Pi subprocess and emits structured events.
 * The adapter is responsible for extracting structured data (text deltas, boot steps)
 * from Pi's raw output streams and serializing user input back to the wire format.
 */
export interface PiProtocolAdapter {
  /** Parse a raw stdout chunk. Calls `emit` with one or more AdapterEvents. */
  onStdout(chunk: string, emit: (event: AdapterEvent) => void): void
  /** Parse a raw stderr chunk. Calls `emit` with log and boot-step events. */
  onStderr(chunk: string, emit: (event: AdapterEvent) => void): void
  /** Serialize a user text input to the Pi wire format. */
  serializeInput(text: string): string
  /** Reset internal state (line buffer, current message ID). */
  reset(): void
}

export function matchBootStep(line: string): InitStep | null {
  const lower = line.toLowerCase()
  if (lower.includes('installing pi dependencies') || lower.includes('npm install')) {
    return 'installing-deps'
  }
  if (lower.includes('building pi workspace') || lower.includes('npm run build') || lower.includes('building')) {
    return 'building-runtime'
  }
  if (lower.includes('creating default manifest') || lower.includes('manifest.json')) {
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

export const INIT_STEPS: { id: InitStep; label: string }[] = [
  { id: 'installing-deps', label: 'Installing Manifest Pi' },
  { id: 'building-runtime', label: 'Building Pi runtime' },
  { id: 'generating-manifest', label: 'Generating default manifest' },
  { id: 'creating-workspace', label: 'Creating workspace' },
  { id: 'launching-runtime', label: 'Launching runtime' },
  { id: 'connecting-chat', label: 'Connecting chat' },
  { id: 'ready', label: 'Agent ready' },
]