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

export function ReadToolCard({ part, result }: ToolCallCardBaseProps) {
  const path = pathFromArgs(part.args)
  return (
    <ToolCallCard
      slots={{
        header: (
          <span className="font-semibold flex items-baseline gap-1.5">
            read{' '}
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
        body: (
          <pre className="font-mono text-xs whitespace-pre-wrap">
            {result ? resultText(result.result) : ''}
          </pre>
        ),
      }}
      state={part.state}
      isError={result?.isError}
    />
  )
}

function resultText(
  result: ReadonlyArray<import('@/models/runtime').ToolResultContent>,
): string {
  return result
    .map((r) => (r.type === 'text' ? r.text : ''))
    .join('')
}
