import type { ContentPart } from '@/models/runtime'
import { ThinkingPart } from './ThinkingPart'
import { ToolCallPart } from './ToolCallPart'
import { MarkdownPart } from './MarkdownPart'
import { ImagePart } from './ImagePart'
import { CompactionCard } from './CompactionCard'

interface PartRendererProps {
  part: ContentPart
  toolResultsById: Map<string, Extract<ContentPart, { type: 'tool-result' }>>
}

export function PartRenderer({ part, toolResultsById }: PartRendererProps) {
  if (part.type === 'thinking') {
    return (
      <ThinkingPart text={part.text} isStreaming={part.state === 'streaming'} />
    )
  }
  if (part.type === 'image') {
    return <ImagePart data={part.data} mimeType={part.mimeType} />
  }
  if (part.type === 'compaction-summary') {
    return (
      <CompactionCard
        tokensBefore={part.tokensBefore}
        summary={part.summary}
      />
    )
  }
  if (part.type === 'text' && part.text.trim()) {
    return <MarkdownPart source={part.text} />
  }
  if (part.type === 'tool-call') {
    return (
      <ToolCallPart
        part={part}
        result={toolResultsById.get(part.id)}
      />
    )
  }
  return null
}
