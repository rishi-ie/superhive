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

export function EditToolCard({ part, result }: ToolCallCardBaseProps) {
  const path = pathFromArgs(part.args)
  return (
    <ToolCallCard
      slots={{
        header: (
          <span className="font-semibold flex items-baseline gap-1.5">
            edit{' '}
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
          <div className="flex flex-col gap-1.5">
            {result && successMessage(resultText(result.result)) ? (
              <span className="text-chat-status-success text-xs">
                {successMessage(resultText(result.result))}
              </span>
            ) : null}
            {result && errorMessage(resultText(result.result)) ? (
              <span className="text-chat-status-error text-xs">
                {errorMessage(resultText(result.result))}
              </span>
            ) : null}
            {result ? resultText(result.result) || '(no output)' : ''}
            <DiffViewPlaceholder path={path} />
          </div>
        ),
      }}
      state={part.state}
      isError={result?.isError}
    />
  )
}

/**
 * Detect Pi's edit error phrases so we can render a destructive callout
 * instead of a green success pill. Pi's tool emits one of these:
 *   "Could not find the text to replace"
 *   "Multiple matches found; please provide more context"
 *   "Old text overlaps with another replacement"
 */
function errorMessage(text: string): string | null {
  if (/could not find the text/i.test(text)) return 'Could not find text'
  if (/multiple matches|multiple occurrences/i.test(text)) return 'Multiple matches'
  if (/overlap/i.test(text)) return 'Overlapping edits'
  return null
}

/**
 * Extract Pi's edit success summary text, e.g. "Successfully replaced N
 * block(s)". Used to render a green confirmation pill under the diff.
 */
function successMessage(text: string): string | null {
  const m = /successfully replaced\s+(\d+)\s+block/i.exec(text)
  if (m) return `Successfully replaced ${m[1]} block${m[1] === '1' ? '' : 's'}`
  if (/edit applied/i.test(text)) return 'Edit applied'
  return null
}

function resultText(
  result: ReadonlyArray<import('@/models/runtime').ToolResultContent>,
): string {
  return result
    .map((r) => (r.type === 'text' ? r.text : ''))
    .join('')
}

/**
 * Stand-in until Phase 6 wires the real `<DiffView>`. Renders a card-shaped
 * placeholder so the layout reserves the right amount of vertical space.
 */
function DiffViewPlaceholder({ path }: { path: string }) {
  return (
    <div className="rounded-card border border-border p-3 text-xs text-muted-foreground flex items-center gap-2">
      <span className="font-mono">{path}</span>
      <span className="text-[10px]">(diff — wired in Phase 6)</span>
    </div>
  )
}
