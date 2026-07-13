import { ToolCallCard, type ToolCallCardBaseProps } from './ToolCallCard'

function pathFromArgs(args: unknown): string {
  if (!args || typeof args !== 'object') return ''
  const obj = args as { path?: unknown }
  return typeof obj.path === 'string' ? obj.path : ''
}

export function LsToolCard({ part, result }: ToolCallCardBaseProps) {
  const path = pathFromArgs(part.args)
  return (
    <ToolCallCard
      slots={{
        header: (
          <span className="font-mono text-xs flex items-center gap-1.5">
            ls{' '}
            <span className="font-mono text-xs text-muted-foreground truncate">
              {path}
            </span>
          </span>
        ),
        body: result ? (
          <pre className="font-mono text-xs whitespace-pre-wrap">
            {result
              .result.map((r) => (r.type === 'text' ? r.text : ''))
              .join('')}
          </pre>
        ) : null,
      }}
      state={part.state}
      isError={result?.isError}
    />
  )
}
