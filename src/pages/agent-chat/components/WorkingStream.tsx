import * as React from 'react'
import {
  THINKING_ICON,
  TEXT_ICON,
  IMAGE_ICON,
  FALLBACK_ICON,
  getToolDisplay,
} from './message-parts/chain-display'
import type { StateOneRow } from './message-parts/state-one-queue'

interface WorkingStreamProps {
  /**
   * Live lineage rows for the in-flight assistant message. The renderer
   * drives this from `message.lineage` directly. The queue mutates it
   * in-flight as the agent streams; we just render it. No timer, no
   * counter, no useRef, no useEffect — just the rows + "Working".
   *
   * When this is empty (the message just started, no thinking or
   * tool-calls yet), we still render the indicator so the user has
   * feedback. When the parent decides to switch to state 2 (the queue
   * freezes the lineage), it stops rendering `<WorkingStream />`.
   */
  lineage: readonly StateOneRow[]
}

export function WorkingStream({ lineage }: WorkingStreamProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-4 sm:px-6 py-2">
      <div className="flex items-center gap-2 rounded-lg border bg-card/30 px-3 py-2 text-card-foreground self-start">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-muted-foreground opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-muted-foreground" />
        </span>
        <span className="text-sm text-muted-foreground">Working</span>
      </div>
      {lineage.length > 0 ? <StreamChain rows={lineage} /> : null}
    </div>
  )
}

function StreamChain({ rows }: { rows: readonly StateOneRow[] }) {
  return (
    <ol className="mt-2 ml-1.5 list-none">
      {rows.map((row, i) => (
        <StreamRow key={row.id} row={row} isLast={i === rows.length - 1} />
      ))}
    </ol>
  )
}

function StreamRow({ row, isLast }: { row: StateOneRow; isLast: boolean }) {
  let Icon: React.ComponentType<{ className?: string }>
  let body: React.ReactNode
  let live = false

  if (row.kind === 'thinking') {
    Icon = THINKING_ICON
    body = <span className="text-foreground/80">Thinking</span>
    live = row.state === 'streaming'
  } else if (row.kind === 'tool-call') {
    Icon = getToolDisplay(row.toolName)?.icon ?? FALLBACK_ICON
    const verb = row.toolName.trim() ? row.toolName : 'Tool call'
    body = <span className="text-foreground/80">{verb}</span>
    live = row.state !== 'complete'
  } else if (row.kind === 'text') {
    Icon = TEXT_ICON
    body = <span className="text-foreground/80">Response</span>
    live = row.state === 'streaming'
  } else if (row.kind === 'image') {
    Icon = IMAGE_ICON
    body = <span className="text-foreground/80">Image</span>
  } else {
    Icon = FALLBACK_ICON
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
        <Icon className="size-3.5 text-muted-foreground" />
      </span>
      {body}
      {live ? (
        <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse" />
      ) : null}
    </li>
  )
}
