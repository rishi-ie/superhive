import { ToolCallCard, type ToolCallCardBaseProps } from './ToolCallCard'

/**
 * Fallback renderer for tools Pi adds via extensions (e.g.
 * `get_current_settings`) that have no specialized card. Shows raw args
 * and result in collapsible JSON viewers so the user can still inspect
 * what the agent did.
 */
export function UnknownToolCard({ part, result }: ToolCallCardBaseProps) {
  return (
    <ToolCallCard
      slots={{
        header: (
          <span className="font-semibold font-mono">{part.name}</span>
        ),
        body: (
          <div className="flex flex-col gap-2">
            <details>
              <summary className="text-[11px] text-muted-foreground cursor-pointer">
                args
              </summary>
              <pre className="font-mono text-[11px] bg-background/50 rounded-sm p-2 overflow-x-auto mt-1">
                {JSON.stringify(part.args, null, 2)}
              </pre>
            </details>
            {result ? (
              <details>
                <summary className="text-[11px] text-muted-foreground cursor-pointer">
                  result
                </summary>
                <pre className="font-mono text-[11px] bg-background/50 rounded-sm p-2 overflow-x-auto max-h-[300px] overflow-y-auto mt-1">
                  {JSON.stringify(result.result, null, 2)}
                </pre>
              </details>
            ) : null}
          </div>
        ),
      }}
      state={part.state}
      isError={result?.isError}
    />
  )
}
