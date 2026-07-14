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
    <ul className="list-disc list-inside my-1.5 gap-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside my-1.5 gap-1">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-sm leading-relaxed">{children}</li>
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
      <code className={className ?? 'bg-muted rounded-sm px-1 py-0.5 font-mono text-[0.85em]'}>
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
          className="bg-chat-bubble-code-bg rounded-chat-code-block overflow-hidden border border-chat-bubble-code-header-bg my-2"
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
  table: ({ children }) => <MarkdownTable>{children}</MarkdownTable>,
  thead: ({ children }) => <thead className="bg-muted/40">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-border">{children}</tr>,
  th: ({ children }) => (
    <th className="text-left text-xs font-medium p-2">{children}</th>
  ),
  td: ({ children }) => <td className="text-xs p-2">{children}</td>,
}

export function MarkdownPart({ source }: MarkdownPartProps) {
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
