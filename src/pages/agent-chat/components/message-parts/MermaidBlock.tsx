import * as React from 'react'
import mermaid from 'mermaid'

/**
 * Phase 14.4 — render a Mermaid diagram from a fenced ```mermaid block.
 * Mermaid emits SVG; we render it via `dangerouslySetInnerHTML` after
 * sanitizing the id to avoid collisions across multiple blocks on the
 * same page.
 *
 * Falls back to a plain `<pre>` of the source on parse error so the user
 * can still read the diagram's intent.
 */

let initialized = false

function ensureInit() {
  if (initialized) return
  initialized = true
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
    fontFamily: 'inherit',
  })
}

interface MermaidBlockProps {
  source: string
}

export function MermaidBlock({ source }: MermaidBlockProps) {
  const idRef = React.useRef(`mermaid-${Math.random().toString(36).slice(2, 10)}`)
  const [svg, setSvg] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  React.useEffect(() => {
    ensureInit()
    let cancelled = false
    ;(async () => {
      try {
        const { svg } = await mermaid.render(idRef.current, source.trim())
        if (!cancelled) {
          setSvg(svg)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [source])
  if (error) {
    return (
      <pre className="font-mono text-xs whitespace-pre-wrap bg-muted/40 border border-border rounded-card p-3 text-destructive">
        {source}
      </pre>
    )
  }
  if (!svg) {
    return (
      <div className="my-2 h-24 w-full rounded-card border border-dashed border-border bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">
        Rendering diagram…
      </div>
    )
  }
  return (
    <div
      className="my-2 rounded-card border border-border bg-background p-3 overflow-x-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
