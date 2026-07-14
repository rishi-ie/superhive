import * as React from 'react'
import { diffWords } from 'diff'

interface DiffViewProps {
  diff: string
}

type DiffRow = {
  type: 'add' | 'remove' | 'context'
  oldLine: number | null
  newLine: number | null
  content: string
}

const HUNK_RE = /^@@\s+-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s+@@/

/**
 * Parse a unified-diff formatted string (output of `diff -u` / Pi's edit
 * tool) into structured rows. Tolerates abbreviated diffs (no `---` /
 * `+++` headers) and skips `No newline at end of file` markers. Returns an
 * empty array on parse failure so callers can fall back to plain-text
 * rendering.
 */
export function parseDiff(diff: string): DiffRow[] {
  const rows: DiffRow[] = []
  const lines = diff.split('\n')
  let oldLine: number | null = null
  let newLine: number | null = null

  for (const line of lines) {
    if (line.startsWith('--- ') || line.startsWith('+++ ')) continue
    const hunk = HUNK_RE.exec(line)
    if (hunk) {
      oldLine = hunk[1] ? Number(hunk[1]) : null
      newLine = hunk[3] ? Number(hunk[3]) : null
      continue
    }
    if (line.startsWith('@@')) continue
    if (line.startsWith('+')) {
      rows.push({
        type: 'add',
        oldLine: null,
        newLine: newLine != null ? newLine : null,
        content: line.slice(1),
      })
      if (newLine != null) newLine++
      continue
    }
    if (line.startsWith('-')) {
      rows.push({
        type: 'remove',
        oldLine: oldLine != null ? oldLine : null,
        newLine: null,
        content: line.slice(1),
      })
      if (oldLine != null) oldLine++
      continue
    }
    if (line.startsWith('\\ No newline at end of file')) continue
    // Context line
    rows.push({
      type: 'context',
      oldLine: oldLine != null ? oldLine : null,
      newLine: newLine != null ? newLine : null,
      content: line.startsWith(' ') ? line.slice(1) : line,
    })
    if (oldLine != null) oldLine++
    if (newLine != null) newLine++
  }
  return rows
}

/**
 * Walk adjacent remove/add rows and run `diffWords` over each pair, so the
 * changed words get inverse-video treatment. Standalone add/remove rows
 * keep the full-line highlight.
 */
function highlightAdjacent(
  rows: DiffRow[],
  renderContent: (
    row: DiffRow,
    additions: { value: string; bold: boolean }[],
  ) => React.ReactNode,
): React.ReactNode[] {
  const out: React.ReactNode[] = []
  for (let i = 0; i < rows.length; i++) {
    const cur = rows[i]!
    const next = rows[i + 1]
    if (cur.type === 'remove' && next && next.type === 'add') {
      const parts = diffWords(cur.content, next.content)
      out.push(
        <span
          key={`r${i}`}
          className="block bg-chat-bubble-diff-removed-bg"
        >
          <span className="inline-block w-7 text-right pr-2 text-muted-foreground/60 select-none">
            {cur.oldLine ?? ''}
          </span>
          <span className="inline-block w-7 text-right pr-2 text-muted-foreground/60 select-none" />
          <span className="inline-block w-3 text-center select-none text-chat-bubble-diff-removed-fg">
            -
          </span>
          {parts
            .filter((p) => p.removed || !p.added)
            .map((p, k) => (
              <span
                key={k}
                className={p.removed ? 'font-bold' : ''}
              >
                {p.value}
              </span>
            ))}
          {'\n'}
        </span>,
      )
      out.push(
        <span
          key={`a${i}`}
          className="block bg-chat-bubble-diff-added-bg"
        >
          <span className="inline-block w-7 text-right pr-2 text-muted-foreground/60 select-none" />
          <span className="inline-block w-7 text-right pr-2 text-muted-foreground/60 select-none">
            {next.newLine ?? ''}
          </span>
          <span className="inline-block w-3 text-center select-none text-chat-bubble-diff-added-fg">
            +
          </span>
          {parts
            .filter((p) => p.added || !p.removed)
            .map((p, k) => (
              <span key={k} className={p.added ? 'font-bold' : ''}>
                {p.value}
              </span>
            ))}
          {'\n'}
        </span>,
      )
      i++ // Skip next (consumed as part of pair)
      continue
    }
    out.push(
      <span
        key={`l${i}`}
        className={
          'block ' +
          (cur.type === 'add'
            ? 'bg-chat-bubble-diff-added-bg'
            : cur.type === 'remove'
              ? 'bg-chat-bubble-diff-removed-bg'
              : '')
        }
      >
        <span className="inline-block w-7 text-right pr-2 text-muted-foreground/60 select-none">
          {cur.oldLine ?? ''}
        </span>
        <span className="inline-block w-7 text-right pr-2 text-muted-foreground/60 select-none">
          {cur.newLine ?? ''}
        </span>
        <span
          className={
            'inline-block w-3 text-center select-none ' +
            (cur.type === 'add'
              ? 'text-chat-bubble-diff-added-fg'
              : cur.type === 'remove'
                ? 'text-chat-bubble-diff-removed-fg'
                : 'text-muted-foreground')
          }
        >
          {cur.type === 'add' ? '+' : cur.type === 'remove' ? '-' : ' '}
        </span>
        {renderContent(cur, [])}
        {'\n'}
      </span>,
    )
  }
  return out
}

const COLLAPSE_THRESHOLD = 100

export function DiffView({ diff }: DiffViewProps) {
  const rows = parseDiff(diff)
  const [expanded, setExpanded] = React.useState(false)
  if (rows.length === 0) {
    return <pre className="font-mono text-xs whitespace-pre">{diff}</pre>
  }
  const isLong = rows.length > COLLAPSE_THRESHOLD
  const visible = !isLong || expanded ? rows : rows.slice(0, COLLAPSE_THRESHOLD)
  const hidden = isLong && !expanded ? rows.length - COLLAPSE_THRESHOLD : 0
  return (
    <div>
      <pre className="font-mono text-xs whitespace-pre overflow-x-auto">
        {highlightAdjacent(visible, (_row, _additions) => null)}
      </pre>
      {isLong && !expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="block w-full text-center text-[11px] text-muted-foreground hover:text-foreground py-1 border-t border-border cursor-pointer"
        >
          Show all ({hidden} more lines)
        </button>
      ) : null}
    </div>
  )
}
