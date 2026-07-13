import type { ContentPart } from '@/models/runtime'

interface ToolResultPartProps {
  part: Extract<ContentPart, { type: 'tool-result' }>
}

/**
 * Stand-alone result renderer. In normal flow, `tool-result` parts get
 * linked into a `<ToolCallPart>` immediately after the matching `tool-call`
 * appears (see Phase 1.2 `tool-execution-end` handler). This component
 * exists for cases where a result arrives without a call — e.g. persisted
 * JSONL where the original call was already pruned — so we can still
 * surface something useful instead of dropping the result on the floor.
 */
export function ToolResultPart({ part }: ToolResultPartProps) {
  return (
    <div className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
      {part.name}
      {part.isError ? ' (failed)' : ''}
      {'\n'}
      {part.result
        .map((r) => (r.type === 'text' ? r.text : ''))
        .join('')}
    </div>
  )
}
