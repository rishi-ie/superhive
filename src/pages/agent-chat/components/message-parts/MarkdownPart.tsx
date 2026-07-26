import React, { Children, isValidElement } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { MermaidBlock } from './MermaidBlock'
import { CodeBlock } from './CodeBlock'
import { MarkdownTable } from './MarkdownTable'

interface MarkdownPartProps {
  source: string
  cwd?: string
	/** Streaming text stays lightweight; completed blocks get full rich rendering. */
	streaming?: boolean
}

function nodeToPlainText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(nodeToPlainText).join('')
  if (isValidElement<{ children?: React.ReactNode }>(node))
    return nodeToPlainText(node.props.children)
  return ''
}

function extractFenceLanguage(className: string | undefined): string {
  if (typeof className !== 'string') return 'text'
  const match = className.match(/(?:^|\s)language-(\S+)/)
  return match?.[1] ?? 'text'
}

function extractCodeFromPre(
  children: React.ReactNode,
): { className: string | undefined; code: string } | null {
  const childNodes = Children.toArray(children)
  if (childNodes.length !== 1) return null
  const onlyChild = childNodes[0]
  if (
    !isValidElement<{ className?: string; children?: React.ReactNode }>(onlyChild) ||
    onlyChild.type !== 'code'
  )
    return null
  return {
    className: onlyChild.props.className,
    code: nodeToPlainText(onlyChild.props.children),
  }
}

function hasShikiClass(children: React.ReactNode): boolean {
  const childNodes = Children.toArray(children)
  if (childNodes.length === 0) return false
  const first = childNodes[0]
  return (
    isValidElement<{ className?: string }>(first) &&
    typeof first.props.className === 'string' &&
    first.props.className.includes('shiki')
  )
}

function getShikiHtml(children: React.ReactNode): string {
  const parts: string[] = []
  Children.forEach(children, (child) => {
    if (isValidElement<{ __html?: string }>(child)) {
      parts.push(String(child.props.__html ?? ''))
    } else if (typeof child === 'string') {
      parts.push(child)
    }
  })
  return parts.join('')
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="mt-5 mb-2 text-xl font-semibold leading-7 tracking-tight first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-5 mb-2 text-lg font-semibold leading-7 tracking-tight first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-4 mb-1.5 text-base font-semibold leading-6 first:mt-0">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mt-4 mb-1 text-sm font-semibold leading-6 first:mt-0">{children}</h4>
  ),
  h5: ({ children }) => (
    <h5 className="mt-4 mb-1 text-sm font-medium leading-6 text-foreground first:mt-0">{children}</h5>
  ),
  h6: ({ children }) => (
    <h6 className="mt-4 mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground first:mt-0">{children}</h6>
  ),
  p: ({ children }) => (
    <p className="my-2 text-[15px] leading-6 first:mt-0 last:mb-0">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-foreground/90">{children}</em>,
  del: ({ children }) => (
    <del className="line-through text-muted-foreground">{children}</del>
  ),
  hr: () => <Separator className="my-3" />,
  ul: ({ children }) => (
    <ul className="my-2 list-disc space-y-1 pl-6 marker:text-muted-foreground [&_ol]:my-1 [&_ul]:my-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 list-decimal space-y-1 pl-6 marker:text-muted-foreground [&_ol]:my-1 [&_ul]:my-1">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="pl-0.5 text-[15px] leading-6 [&>p]:my-0">{children}</li>
  ),
  input: ({ checked, type }) => {
    if (type !== 'checkbox') return null
    return <Checkbox checked={!!checked} disabled className="align-middle mr-1.5" />
  },
  code: ({ children, className }) => {
    const isBlock =
      typeof className === 'string' && className.startsWith('language-')
    if (isBlock) {
      const lang = className.replace(/^language-/, '')
      const text = nodeToPlainText(children).replace(/\n$/, '')
      if (lang === 'mermaid') {
        return <MermaidBlock source={text} />
      }
    }
    return (
      <code className={className ?? 'rounded-md border border-border/60 bg-muted/70 px-1.5 py-0.5 font-mono text-[0.84em] text-foreground'}>
        {children}
      </code>
    )
  },
  pre: ({ children }) => {
    const shiki = hasShikiClass(children)
    if (shiki) {
      const html = getShikiHtml(children)
      return (
        <div
          className="my-3 overflow-hidden rounded-chat-code-block border border-chat-bubble-code-header-bg bg-chat-bubble-code-bg"
        >
          <div
            className="max-h-[500px] overflow-auto px-3 py-2 text-xs font-mono [&_.shiki]:!bg-transparent"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      )
    }
    const extracted = extractCodeFromPre(children)
    if (!extracted) return <pre>{children}</pre>
    const lang = extractFenceLanguage(extracted.className)
    if (lang === 'mermaid') {
      return <MermaidBlock source={extracted.code} />
    }
    return <CodeBlock lang={lang} code={extracted.code} />
  },
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:text-primary/80 hover:decoration-primary"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-primary/50 py-0.5 pl-4 text-[15px] leading-6 text-muted-foreground [&_p]:my-0">
      {children}
    </blockquote>
  ),
  table: ({ children }) => <MarkdownTable>{children}</MarkdownTable>,
  thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-border/70 last:border-b-0">{children}</tr>,
  th: ({ children }) => (
    <th className="sticky top-0 bg-muted/95 p-2.5 text-left text-xs font-semibold text-foreground">{children}</th>
  ),
  td: ({ children }) => <td className="p-2.5 text-xs leading-5 text-foreground/90">{children}</td>,
}

export function MarkdownPart({ source, streaming = false }: MarkdownPartProps) {
	if (streaming) {
		return (
			<div className="text-base leading-relaxed whitespace-pre-wrap break-words">
				{source}
				<span aria-hidden className="ml-0.5 inline-block h-4 w-0.5 align-[-2px] bg-foreground/70 animate-pulse" />
			</div>
		)
	}
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={components}
    >
      {source}
    </ReactMarkdown>
  )
}
