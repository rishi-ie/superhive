import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownPartProps {
  source: string
}

/** Custom renderer map. Populated incrementally across Phase 3.3+ to give
 *  the assistant chat its typographic identity (sizing, weights, links,
 *  tables, code). Until then each entry is a no-op passthrough, set so the
 *  structure is in place when the first renderer lands. */
const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-base font-semibold tracking-tight">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-sm font-semibold mt-3 mb-1.5">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-medium mt-3 mb-1">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{children}</h4>
  ),
  h5: ({ children }) => (
    <h5 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{children}</h5>
  ),
  h6: ({ children }) => (
    <h6 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{children}</h6>
  ),
  p: ({ children }) => (
    <p className="text-sm leading-relaxed my-1.5">{children}</p>
  ),
}

export function MarkdownPart({ source }: MarkdownPartProps) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {source}
    </ReactMarkdown>
  )
}
