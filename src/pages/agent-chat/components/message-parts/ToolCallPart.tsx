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

/**
 * Dispatch a single tool call to its specialized renderer. The renderer for
 * unrecognized tool names falls back to `<UnknownToolCard>` so future
 * extension-registered tools still render.
 */
export function ToolCallPart({ part, result }: ToolCallPartProps) {
  switch (part.name) {
    case 'bash':
      return <BashToolCard part={part} result={result} />
    case 'read':
      return <ReadToolCard part={part} result={result} />
    case 'edit':
      return <EditToolCard part={part} result={result} />
    case 'write':
      return <WriteToolCard part={part} result={result} />
    case 'grep':
      return <GrepToolCard part={part} result={result} />
    case 'find':
      return <FindToolCard part={part} result={result} />
    case 'ls':
      return <LsToolCard part={part} result={result} />
    default:
      return <UnknownToolCard part={part} result={result} />
  }
}
