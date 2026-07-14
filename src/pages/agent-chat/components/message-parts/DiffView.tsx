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

export function DiffView({ diff }: DiffViewProps) {
  const rows = parseDiff(diff)
  if (rows.length === 0) {
    return <pre className="font-mono text-xs whitespace-pre">{diff}</pre>
  }
  return (
    <pre className="font-mono text-xs whitespace-pre">
      {rows.map((row, i) => (
        <span
          key={i}
          className={
            'block ' +
            (row.type === 'add'
              ? 'bg-chat-bubble-diff-added-bg'
              : row.type === 'remove'
                ? 'bg-chat-bubble-diff-removed-bg'
                : '')
          }
        >
          <span className="inline-block w-7 text-right pr-2 text-muted-foreground/60 select-none">
            {row.oldLine ?? ''}
          </span>
          <span className="inline-block w-7 text-right pr-2 text-muted-foreground/60 select-none">
            {row.newLine ?? ''}
          </span>
          {row.content}
          {'\n'}
        </span>
      ))}
    </pre>
  )
}
