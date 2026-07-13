import { HugeIcon } from '@/components/ui/huge-icon'
import { FolderIcon, File01Icon } from '@hugeicons/core-free-icons'
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
          <ul className="flex flex-col gap-0.5">
            {result.result
              .map((r) => (r.type === 'text' ? r.text : ''))
              .join('')
              .split('\n')
              .map((l) => l.trim())
              .filter((l) => l)
              .map((line, i) => (
                <li
                  key={i}
                  className="font-mono text-xs flex items-center gap-1.5"
                >
                  <HugeIcon
                    icon={line.endsWith('/') ? FolderIcon : File01Icon}
                    className="size-3.5 text-muted-foreground"
                  />
                  <span>{line}</span>
                </li>
              ))}
          </ul>
        ) : null,
      }}
      state={part.state}
      isError={result?.isError}
    />
  )
}
