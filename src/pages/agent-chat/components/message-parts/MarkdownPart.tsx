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
}

export function MarkdownPart({ source }: MarkdownPartProps) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {source}
    </ReactMarkdown>
  )
}
