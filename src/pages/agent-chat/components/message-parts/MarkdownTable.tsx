import * as React from 'react'
import { Children, cloneElement, isValidElement } from 'react'
import { CaretDownIcon, CaretRightIcon } from '@phosphor-icons/react'
import { CheckIcon, Copy01Icon } from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import { copyTable } from '@/flows/ui/copy-table'
import { HugeIcon } from '@/components/ui/huge-icon'
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
  const [copiedFormat, setCopiedFormat] = React.useState<'md' | 'csv' | null>(null)
  const copyTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const tableChildren = children

  const rawMd = React.useMemo(
    () => serializeTableToMarkdown(tableChildren),
    [tableChildren],
  )

  const rawCsv = React.useMemo(
    () => serializeTableToCsv(tableChildren),
    [tableChildren],
  )

  const handleCopy = React.useCallback(
    async (format: 'md' | 'csv') => {
      const text = format === 'md' ? rawMd : rawCsv
      if (!text) return
      const ok = await copyTable(format, text)
      if (!ok) return
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
      setCopiedFormat(format)
      copyTimerRef.current = setTimeout(() => {
        setCopiedFormat(null)
        copyTimerRef.current = null
      }, 1500)
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
	const visibleChildren = React.useMemo(() => {
		if (isExpanded || !showToggle) return children
		return Children.map(children, (section) => {
			if (!isValidElement<{ children?: React.ReactNode }>(section)) return section
			const tagName =
				(section.type as React.ComponentType<{ tagName?: string }>).displayName?.toLowerCase() ??
				(section.type as unknown as string) ??
				''
			if (tagName !== 'tbody') return section
			return cloneElement(section, undefined, Children.toArray(section.props.children).slice(0, COLLAPSED_ROW_COUNT - 1))
		})
	}, [children, isExpanded, showToggle])

  return (
    <div className={cn('relative my-3', className)}>
      <div className="relative group">
		<div className="overflow-x-auto">
			<table className="min-w-max w-full border-collapse text-[15px] leading-6">
				{visibleChildren}
          </table>
        </div>
        <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="h-6 w-6 bg-transparent text-muted-foreground hover:bg-transparent hover:text-foreground"
                aria-label="Copy table"
              >
                {copiedFormat ? (
                  <HugeIcon icon={CheckIcon} size={13} className="size-3.5 text-chat-status-success" />
                ) : (
                  <HugeIcon icon={Copy01Icon} size={13} className="size-3.5 text-muted-foreground" />
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
          className="mt-2 flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
