import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'

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
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => (
    <del className="line-through text-muted-foreground">{children}</del>
  ),
  hr: () => <Separator className="my-3" />,
  ul: ({ children }) => (
    <ul className="list-disc list-inside my-1.5 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside my-1.5 space-y-1">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-sm leading-relaxed">{children}</li>
  ),
  // GFM task list items render as `<li>` with a leading `<input type=checkbox">`.
  // react-markdown delegates to the `input` renderer for the checkbox itself.
  input: ({ checked, type }) => {
    if (type !== 'checkbox') return null
    return (
      <Checkbox checked={!!checked} disabled className="align-middle mr-1.5" />
    )
  },
  // Inline code: detect via absence of `className` (shiki-marked blocks have
  // `className` starting with `language-`). Fall through to the default
  // renderer for fenced blocks so they keep flow through `<pre>` below.
  code: ({ children, className }) => {
    const isBlock = typeof className === 'string' && className.startsWith('language-')
    if (isBlock) {
      // P3.9 will replace this with `<CodeBlock lang code>`; until then,
      // pass through to the default renderer so fenced blocks still render.
      return <code className={className}>{children}</code>
    }
    return (
      <code className="bg-muted rounded-sm px-1 py-0.5 font-mono text-[0.85em]">
        {children}
      </code>
    )
  },
  // Strip the default `<pre>` chrome (background, padding, scroll) and let
  // the child `<code>` inherit. Phase 3.9 will replace this with a wrapper
  // that pulls out `lang` and forwards to `<CodeBlock>`.
  pre: ({ children }) => <pre className="my-2 not-prose">{children}</pre>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline underline-offset-2 hover:text-primary/80"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-border pl-3 italic text-muted-foreground">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto rounded-card border border-border">
      <table className="w-full border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/40">{children}</thead>,
}

export function MarkdownPart({ source }: MarkdownPartProps) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {source}
    </ReactMarkdown>
  )
}
