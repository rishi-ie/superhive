import * as React from 'react'
import { ChevronDownIcon } from 'lucide-react'

interface TurnFoldRowProps {
  startedAt: number
  endedAt: number
  toolCount: number
  totalNonTextParts: number
  defaultCollapsed?: boolean
  children: React.ReactNode
}

function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s === 0 ? `${m}m` : `${m}m ${s}s`
}

export function TurnFoldRow({
  startedAt,
  endedAt,
  toolCount,
  totalNonTextParts,
  defaultCollapsed = true,
  children,
}: TurnFoldRowProps) {
  const [expanded, setExpanded] = React.useState(!defaultCollapsed)

  const duration = endedAt - startedAt
  const label = `Worked for ${formatDuration(duration)}`
  const detail =
    totalNonTextParts > 0
      ? `${toolCount} tool${toolCount === 1 ? '' : 's'}`
      : toolCount > 0
        ? `${toolCount} tool${toolCount === 1 ? '' : 's'}`
        : null

  return (
    <div className="flex flex-col">
      <button
        type="button"
        className="flex cursor-pointer items-center gap-1.5 py-1 text-left text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 rounded-sm"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <ChevronDownIcon
          className={`size-3.5 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-0' : '-rotate-90'}`}
        />
        <span>{label}</span>
        {detail ? (
          <>
            <span className="text-muted-foreground/50">·</span>
            <span>{detail}</span>
          </>
        ) : null}
      </button>
      {expanded ? <div className="pt-1">{children}</div> : null}
    </div>
  )
}
