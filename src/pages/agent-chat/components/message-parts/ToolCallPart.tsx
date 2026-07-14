import type { ContentPart } from '@/models/runtime'
import { BashToolCard } from './BashToolCard'
import { ReadToolCard } from './ReadToolCard'
import { EditToolCard } from './EditToolCard'
import { WriteToolCard } from './WriteToolCard'
import { GrepToolCard } from './GrepToolCard'
import { FindToolCard } from './FindToolCard'
import { LsToolCard } from './LsToolCard'
import { UnknownToolCard } from './UnknownToolCard'

interface ToolCallPartProps {
  part: Extract<ContentPart, { type: 'tool-call' }>
  result?: Extract<ContentPart, { type: 'tool-result' }>
}

/** Derive whether the tool call is currently in-flight (executing). */
function deriveRunning(
  part: Extract<ContentPart, { type: 'tool-call' }>,
  result?: Extract<ContentPart, { type: 'tool-result' }>,
): boolean {
  if (part.state !== 'complete') return true
  if (result && result.state !== 'complete') return true
  return false
}

/**
 * Dispatch a single tool call to its specialized renderer. The renderer for
 * unrecognized tool names falls back to `<UnknownToolCard>` so future
 * extension-registered tools still render.
 */
export function ToolCallPart({ part, result }: ToolCallPartProps) {
  const running = deriveRunning(part, result)
  switch (part.name) {
    case 'bash':
      return <BashToolCard part={part} result={result} running={running} />
    case 'read':
      return <ReadToolCard part={part} result={result} running={running} />
    case 'edit':
      return <EditToolCard part={part} result={result} running={running} />
    case 'write':
      return <WriteToolCard part={part} result={result} running={running} />
    case 'grep':
      return <GrepToolCard part={part} result={result} running={running} />
    case 'find':
      return <FindToolCard part={part} result={result} running={running} />
    case 'ls':
      return <LsToolCard part={part} result={result} running={running} />
    default:
      return <UnknownToolCard part={part} result={result} running={running} />
  }
}
