import * as React from 'react'
import { ToolCallCard, type ToolCallCardBaseProps } from './ToolCallCard'

function pathFromArgs(args: unknown): string {
  if (!args || typeof args !== 'object') return ''
  const obj = args as { path?: unknown; filePath?: unknown }
  return typeof obj.path === 'string'
    ? obj.path
    : typeof obj.filePath === 'string'
      ? obj.filePath
      : ''
}

export function WriteToolCard({ part, result }: ToolCallCardBaseProps) {
  const path = pathFromArgs(part.args)
  const [expanded, setExpanded] = React.useState(false)
  return (
    <ToolCallCard
      slots={{
        header: (
          <span className="font-semibold flex items-baseline gap-1.5">
            write{' '}
            <a
              href={`file://${path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-primary underline underline-offset-2 hover:text-primary/80 truncate"
            >
              {path}
            </a>
          </span>
        ),
        body: result ? (
          <WritePreview result={result} expanded={expanded} setExpanded={setExpanded} />
        ) : null,
      }}
      state={part.state}
      isError={result?.isError}
    />
  )
}

function WritePreview({
  result,
  expanded,
  setExpanded,
}: {
  result: Extract<
    import('@/models/runtime').ContentPart,
    { type: 'tool-result' }
  >
  expanded: boolean
  setExpanded: (v: boolean) => void
}) {
  const text = result.result
    .map((r) => (r.type === 'text' ? r.text : ''))
    .join('')
  const lines = text.split('\n')
  const PREVIEW = 10
  const isLong = lines.length > PREVIEW
  const visible = expanded ? lines : lines.slice(0, PREVIEW)
  return (
    <div>
      <pre className="font-mono text-xs whitespace-pre-wrap">
        {visible.join('\n')}
        {isLong && !expanded ? '\n…' : ''}
      </pre>
      {isLong ? (
        <div className="text-[11px] text-muted-foreground mt-1">
          {expanded
            ? `Showing all ${lines.length} lines`
            : `Showing first ${PREVIEW} of ${lines.length} lines`}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="ml-2 underline text-primary hover:text-primary/80 cursor-pointer"
          >
            {expanded ? 'Collapse' : 'Show all'}
          </button>
        </div>
      ) : null}
    </div>
  )
}

function resultText(
  result: ReadonlyArray<import('@/models/runtime').ToolResultContent>,
): string {
  return result
    .map((r) => (r.type === 'text' ? r.text : ''))
    .join('')
}
