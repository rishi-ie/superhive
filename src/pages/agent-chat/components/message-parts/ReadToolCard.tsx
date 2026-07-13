import * as React from 'react'
import { ToolCallCard, type ToolCallCardBaseProps } from './ToolCallCard'
import { CodeBlock } from './CodeBlock'
import { getHighlighter } from '@/lib/shiki'

/** Language hint extracted from a file path's extension. */
function langFromPath(path: string): string {
  const i = path.lastIndexOf('.')
  if (i === -1) return 'text'
  const ext = path.slice(i + 1).toLowerCase()
  const map: Record<string, string> = {
    ts: 'ts',
    tsx: 'tsx',
    js: 'js',
    jsx: 'jsx',
    json: 'json',
    md: 'markdown',
    py: 'python',
    sh: 'bash',
    bash: 'bash',
    yml: 'yaml',
    yaml: 'yaml',
    html: 'html',
    css: 'css',
  }
  return map[ext] ?? 'text'
}

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
  const lang = langFromPath(path)
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
        body: result ? <ReadBody result={result} lang={lang} /> : null,
      }}
      state={part.state}
      isError={result?.isError}
    />
  )
}

function ReadBody({
  result,
  lang,
}: {
  result: Extract<
    import('@/models/runtime').ContentPart,
    { type: 'tool-result' }
  >
  lang: string
}) {
  const text = result.result
    .map((r) => (r.type === 'text' ? r.text : ''))
    .join('')
  const [highlighted, setHighlighted] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    getHighlighter()
      .then((h) => {
        if (cancelled) return
        const loaded = h.getLoadedLanguages()
        const resolved = loaded.includes(lang as never) ? lang : 'text'
        setHighlighted(h.codeToHtml(text, { lang: resolved, theme: 'github-light' }))
      })
      .catch(() => {
        if (cancelled) return
        setHighlighted(null)
      })
    return () => {
      cancelled = true
    }
  }, [text, lang])

  if (highlighted) {
    return (
      <div className="font-mono text-xs">
        <CodeBlock lang={lang} code={text} />
      </div>
    )
  }
  // Plain text fallback (shiki not ready / lang unsupported)
  return (
    <pre className="font-mono text-xs whitespace-pre">
      {lineNumbered(text)}
    </pre>
  )
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
