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
          <pre className="font-mono text-xs whitespace-pre">
            {result
              ? result
                  .result.map((r) =>
                      r.type === 'text' ? lineNumbered(r.text) : '',
                    )
                  .join('')
              : ''}
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

/**
 * Render text with right-aligned line numbers in a muted gutter. The 6-char
 * gutter fits files up to 99999 lines; longer reads wrap.
 */
function lineNumbered(text: string): React.ReactNode {
  const lines = text.split('\n')
  return lines.map((line, i) => (
    <span key={i} className="block">
      <span className="inline-block w-12 text-right pr-2 text-muted-foreground/60 select-none">
        {i + 1}
      </span>
      {line}
      {'\n'}
    </span>
  ))
}
