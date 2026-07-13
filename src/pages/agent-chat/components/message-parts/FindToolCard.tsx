import { ToolCallCard, type ToolCallCardBaseProps } from './ToolCallCard'

function argsFromToolCall(args: unknown): {
  pattern?: string
  path?: string
} {
  if (!args || typeof args !== 'object') return {}
  const obj = args as Record<string, unknown>
  return {
    pattern: typeof obj.pattern === 'string' ? obj.pattern : undefined,
    path: typeof obj.path === 'string' ? obj.path : undefined,
  }
}

export function FindToolCard({ part, result }: ToolCallCardBaseProps) {
  const { pattern, path } = argsFromToolCall(part.args)
  return (
    <ToolCallCard
      slots={{
        header: (
          <span className="font-mono text-xs flex items-center gap-1.5">
            find{' '}
            <span className="font-semibold text-foreground">{pattern ?? ''}</span>
            {path ? (
              <>
                <span className="text-muted-foreground">in</span>
                <span className="text-muted-foreground truncate">{path}</span>
              </>
            ) : null}
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
