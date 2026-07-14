import * as React from 'react'
import { Children, isValidElement } from 'react'
import { CaretDownIcon, CaretRightIcon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface MarkdownTableProps {
  children: React.ReactNode
  className?: string
}

const COLLAPSED_ROW_COUNT = 8

function extractTextFromNode(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(extractTextFromNode).join('')
  if (isValidElement<{ children?: React.ReactNode }>(node))
    return extractTextFromNode(node.props.children)
  return ''
}

function serializeTableToMarkdown(tableChildren: React.ReactNode): string {
  const rows: string[][] = []

  Children.forEach(tableChildren, (child) => {
    if (!isValidElement<{ children?: React.ReactNode }>(child)) return
    const tagName: string = (child.type as React.ComponentType<{ tagName?: string }>).displayName?.toLowerCase() ??
      (child.type as unknown as string) ??
      ''

    if (tagName === 'thead' || tagName === 'tbody') {
      Children.forEach(child.props.children, (row) => {
        if (!isValidElement<{ children?: React.ReactNode }>(row)) return
        const cells: string[] = []
        Children.forEach(row.props.children, (cell) => {
          if (!isValidElement<{ children?: React.ReactNode }>(cell)) return
          cells.push(extractTextFromNode(cell.props.children).trim())
        })
        if (cells.length > 0) rows.push(cells)
      })
    }
  })

  const header = rows[0]
  if (!header) return ''
  const colCount = header.length
  const separator = `| ${Array(colCount).fill('---').join(' | ')} |`
  return [
    `| ${header.join(' | ')} |`,
    separator,
    ...rows.slice(1).map((r) => `| ${r.join(' | ')} |`),
  ].join('\n')
}

function serializeTableToCsv(tableChildren: React.ReactNode): string {
  const rows: string[][] = []

  Children.forEach(tableChildren, (child) => {
    if (!isValidElement<{ children?: React.ReactNode }>(child)) return
    const tagName: string =
      (child.type as React.ComponentType<{ tagName?: string }>).displayName?.toLowerCase() ??
      (child.type as unknown as string) ??
      ''

    if (tagName === 'thead' || tagName === 'tbody') {
      Children.forEach(child.props.children, (row) => {
        if (!isValidElement<{ children?: React.ReactNode }>(row)) return
        const cells: string[] = []
        Children.forEach(row.props.children, (cell) => {
          if (!isValidElement<{ children?: React.ReactNode }>(cell)) return
          cells.push(extractTextFromNode(cell.props.children).trim())
        })
        if (cells.length > 0) rows.push(cells)
      })
    }
  })

  return rows
    .map((row) =>
      row
        .map((cell) => {
          if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
            return `"${cell.replace(/"/g, '""')}"`
          }
          return cell
        })
        .join(','),
    )
    .join('\n')
}

export function MarkdownTable({ children, className }: MarkdownTableProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [isOverflowing, setIsOverflowing] = React.useState(false)
  const [copiedFormat, setCopiedFormat] = React.useState<'md' | 'csv' | null>(null)
  const copyTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const tableChildren = children

  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      setIsOverflowing(el.scrollWidth > el.clientWidth)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const rawMd = React.useMemo(
    () => serializeTableToMarkdown(tableChildren),
    [tableChildren],
  )

  const rawCsv = React.useMemo(
    () => serializeTableToCsv(tableChildren),
    [tableChildren],
  )

  const handleCopy = React.useCallback(
    (format: 'md' | 'csv') => {
      const text = format === 'md' ? rawMd : rawCsv
      if (!text) return
      navigator.clipboard.writeText(text).then(() => {
        if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
        setCopiedFormat(format)
        copyTimerRef.current = setTimeout(() => {
          setCopiedFormat(null)
          copyTimerRef.current = null
        }, 1500)
      })
    },
    [rawMd, rawCsv],
  )

  const allTrs = Children.toArray(children).flatMap((theadOrTbody) => {
    if (!isValidElement<{ children?: React.ReactNode }>(theadOrTbody)) return []
    const tagName =
      (theadOrTbody.type as React.ComponentType<{ tagName?: string }>).displayName?.toLowerCase() ??
      (theadOrTbody.type as unknown as string) ??
      ''
    if (tagName !== 'thead' && tagName !== 'tbody') return []
    return Children.toArray(theadOrTbody.props.children).filter(
      (c): c is React.ReactElement<{ children?: React.ReactNode }> =>
        isValidElement(c),
    )
  })

  const showToggle = allTrs.length > COLLAPSED_ROW_COUNT
  const hiddenCount = allTrs.length - COLLAPSED_ROW_COUNT

  return (
    <div className={cn('relative my-2', className)}>
      <div className="relative group">
        <div
          ref={containerRef}
          className="overflow-x-auto rounded-chat-code-block border border-chat-bubble-code-header-bg"
        >
          <table className="w-full border-collapse text-xs font-mono">
            {children}
          </table>
        </div>
        {isOverflowing && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        )}
        <div className="absolute right-1.5 top-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="h-5 w-5 bg-background/80 hover:bg-background border border-border"
                aria-label="Copy table"
              >
                {copiedFormat ? (
                  <span className="text-[10px] text-chat-status-success font-mono">
                    {copiedFormat.toUpperCase()}
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground font-mono">COPY</span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleCopy('md')}>
                Copy as Markdown
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCopy('csv')}>
                Copy as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {showToggle && (
        <button
          type="button"
          className="flex items-center gap-1 mt-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setIsExpanded((v) => !v)}
        >
          {isExpanded ? (
            <CaretDownIcon className="size-3" />
          ) : (
            <CaretRightIcon className="size-3" />
          )}
          {isExpanded
            ? 'Show fewer rows'
            : `Show all ${allTrs.length} rows (hide ${hiddenCount})`}
        </button>
      )}
    </div>
  )
}
