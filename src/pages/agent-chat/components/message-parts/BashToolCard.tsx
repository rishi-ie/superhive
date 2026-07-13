import { ToolCallCard, type ToolCallCardBaseProps } from './ToolCallCard'

/**
 * Bash tool — renders the command, stdout/stderr, and an exit-code badge.
 * Specialized layout lives here; chrome (background, status dot, duration,
 * collapse-by-default) is owned by `<ToolCallCard>`.
 */
export function BashToolCard({ part, result }: ToolCallCardBaseProps) {
  const command =
    part.args && typeof part.args === 'object' && 'command' in part.args
      ? String((part.args as { command: unknown }).command)
      : ''
  return (
    <ToolCallCard
      slots={{
        header: <span>bash</span>,
        body: (
          <div>
            <pre className="font-mono text-xs whitespace-pre-wrap">$ {command}</pre>
            {result ? (
              <pre className="font-mono text-xs whitespace-pre-wrap mt-2">
                {resultText(result.result)}
              </pre>
            ) : null}
          </div>
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
