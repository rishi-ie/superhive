import * as React from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  THINKING_ICON,
  TEXT_ICON,
  IMAGE_ICON,
  FALLBACK_ICON,
  getToolDisplay,
} from './chain-display'
import { countByKind, type StateOneRow } from './state-one-queue'

interface ActionChainFoldProps {
  /**
   * The frozen lineage from `message.lineage`. This is the canonical
   * source for the fold — every row that was being assembled in state 1
   * is now a static row here. The fold never reaches back into
   * `message.parts`.
   *
   * Persisted to `<agentDir>/chat.jsonl` as part of the message, so
   * page-refresh hydration reads it directly via the slice's
   * `set-messages` op.
   */
  rows: readonly StateOneRow[]
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s
  return s.slice(0, n).trimEnd() + '…'
}

function foldLabel(rows: readonly StateOneRow[]): string {
  const { thoughts, toolCalls } = countByKind(rows)
  const parts: string[] = []
  if (thoughts > 0) {
    parts.push(`Thought ${thoughts} time${thoughts === 1 ? '' : 's'}`)
  }
  if (toolCalls > 0) {
    parts.push(`Tool call ${toolCalls} time${toolCalls === 1 ? '' : 's'}`)
  }
  return parts.length > 0 ? parts.join(' · ') : 'Worked'
}

export function ActionChainFold({ rows }: ActionChainFoldProps) {
  const [open, setOpen] = React.useState(false)
  const label = foldLabel(rows)

  return (
    <div className="text-xs">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronDownIcon
          className={cn('size-3 transition-transform', open ? 'rotate-0' : '-rotate-90')}
        />
        <span>{label}</span>
      </button>

      {open ? <ActionChain rows={rows} /> : null}
    </div>
  )
}

function ActionChain({ rows }: { rows: readonly StateOneRow[] }) {
  return (
    <ol className="mt-2 ml-1.5 list-none">
      {rows.map((row, i) => (
        <ActionChainItem key={row.id} row={row} isLast={i === rows.length - 1} />
      ))}
    </ol>
  )
}

function ActionChainItem({ row, isLast }: { row: StateOneRow; isLast: boolean }) {
  const [open, setOpen] = React.useState(false)

  let IconComp: React.ComponentType<{ className?: string }>
  let body: React.ReactNode
  let expandable = false
  let expandText: string | null = null

  if (row.kind === 'thinking') {
    IconComp = THINKING_ICON
    expandable = row.text.length > 0
    expandText = row.text
    body = expandable ? (
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-foreground/80 hover:text-foreground cursor-pointer text-left"
      >
        Thinking process
      </button>
    ) : (
      <span className="text-foreground/80">Thinking process</span>
    )
  } else if (row.kind === 'tool-call') {
    IconComp = getToolDisplay(row.toolName)?.icon ?? FALLBACK_ICON
    const verb = row.toolName.trim() ? row.toolName : 'Tool call'
    body = (
      <span className="text-foreground/80">
        {verb}
        {row.firstArg ? (
          <span className="text-foreground/60"> &quot;{row.firstArg}&quot;</span>
        ) : null}
      </span>
    )
  } else if (row.kind === 'text') {
    IconComp = TEXT_ICON
    const truncated = truncate(row.text.trim(), 80)
    expandable = row.text.length > 80
    expandText = row.text
    body = expandable ? (
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-foreground/80 hover:text-foreground cursor-pointer text-left"
      >
        Response <span className="text-foreground/60">&quot;{truncated}&quot;</span>
      </button>
    ) : (
      <span className="text-foreground/80">
        Response <span className="text-foreground/60">&quot;{truncated}&quot;</span>
      </span>
    )
  } else if (row.kind === 'image') {
    IconComp = IMAGE_ICON
    body = <span className="text-foreground/80">Image</span>
  } else {
    IconComp = FALLBACK_ICON
    body = (
      <span className="text-foreground/60 italic">
        Compaction · {row.tokensBefore.toLocaleString()} tokens
      </span>
    )
  }

  return (
    <li className="relative pl-6 pb-2">
      {!isLast ? (
        <span
          aria-hidden
          className="absolute left-[7px] top-3 bottom-0 w-px bg-border"
        />
      ) : null}
      <span
        aria-hidden
        className="absolute left-0 top-0.5 flex size-3.5 items-center justify-center rounded-full bg-background"
      >
        <IconComp className="size-3.5 text-muted-foreground" />
      </span>
      {body}
      {expandable && open && expandText ? (
        <p className="mt-1 text-foreground/60 text-[11px] whitespace-pre-wrap">
          {expandText}
        </p>
      ) : null}
    </li>
  )
}
