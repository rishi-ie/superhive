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
      <pre className="my-3 max-h-[500px] overflow-auto whitespace-pre-wrap rounded-card border border-destructive/30 bg-muted/25 p-3 font-mono text-[13px] leading-5 text-destructive">
        {source}
      </pre>
    )
  }
  if (!svg) {
    return (
      <div className="my-3 flex h-24 w-full items-center justify-center rounded-card border border-border/70 bg-muted/25 text-[13px] text-muted-foreground">
        Rendering diagram…
      </div>
    )
  }
  return (
    <div
      className="my-3 max-h-[500px] overflow-auto rounded-card border border-border/70 bg-muted/25 p-3 [&_svg]:h-auto [&_svg]:max-w-none"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
