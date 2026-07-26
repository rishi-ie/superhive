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
    <h1 className="mt-6 mb-2 text-xl font-semibold leading-7 tracking-tight first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-6 mb-2 text-lg font-semibold leading-7 tracking-tight first:mt-0">{children}</h2>
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
    <p className="my-2.5 text-[15px] leading-6 first:mt-0 last:mb-0">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-foreground/90">{children}</em>,
  del: ({ children }) => (
    <del className="line-through text-muted-foreground">{children}</del>
  ),
  hr: () => <Separator className="my-4 bg-border/70" />,
  ul: ({ children }) => (
    <ul className="my-2.5 list-disc space-y-1 pl-5 marker:text-muted-foreground [&_ol]:my-1.5 [&_ul]:my-1.5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2.5 list-decimal space-y-1 pl-5 marker:text-muted-foreground [&_ol]:my-1.5 [&_ul]:my-1.5">{children}</ol>
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
      <code className={`${className ?? ''} rounded-[4px] bg-muted/70 px-1 py-px font-mono text-[0.86em] text-foreground`}>
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
          className="my-3 overflow-hidden rounded-card border border-border/70 bg-muted/25"
        >
          <div className="flex items-center border-b border-border/60 bg-muted/40 px-3 py-1.5">
            <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Code</span>
          </div>
          <div
            className="max-h-[500px] overflow-auto px-3 py-2 text-[13px] leading-5 font-mono [&_.shiki]:!bg-transparent"
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
      className="font-medium text-foreground underline decoration-muted-foreground/60 underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-border py-0.5 pl-3 text-[15px] leading-6 text-muted-foreground [&_p]:my-0">
      {children}
    </blockquote>
  ),
  table: ({ children }) => <MarkdownTable>{children}</MarkdownTable>,
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-border/60 last:border-b-0">{children}</tr>,
  th: ({ children }) => (
    <th className="px-3 py-3 text-left text-[15px] font-semibold leading-6 text-foreground first:pl-0 last:pr-0">{children}</th>
  ),
  td: ({ children }) => <td className="px-3 py-3 text-[15px] leading-6 text-foreground/90 first:pl-0 last:pr-0">{children}</td>,
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
    <div className="[&_.katex-display]:my-3 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-1">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {source}
      </ReactMarkdown>
    </div>
  )
}
