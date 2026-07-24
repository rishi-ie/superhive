import * as React from 'react'
import { HugeIcon } from '@/components/ui/huge-icon'
import { ArrowDown01Icon } from '@hugeicons/core-free-icons'
import { MarkdownPart } from './MarkdownPart'
import { cn } from '@/lib/utils'

interface CompactionCardProps {
  tokensBefore: number
  summary: string
}

/**
 * Renders a `compaction-summary` content part emitted by main when a
 * context compaction finishes. The collapsed form shows a horizontal
 * divider-style row with the before/after token count. Click expands to
 * the full markdown summary.
 */
export function CompactionCard({ tokensBefore, summary }: CompactionCardProps) {
  const [open, setOpen] = React.useState(false)
  return (
    <div className="my-3 flex flex-col items-stretch gap-2">
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-dashed border-border" />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-full border border-dashed border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground cursor-pointer hover:bg-muted/70 hover:text-foreground transition-colors"
          aria-expanded={open}
        >
          <span className="font-mono uppercase tracking-wider">Compaction</span>
          <span className="text-foreground/70">{tokensBefore.toLocaleString()} tokens &rarr; summary</span>
          <HugeIcon
            icon={ArrowDown01Icon}
            size={12}
            className={cn('size-3 transition-transform', open && 'rotate-180')}
          />
        </button>
        <div className="flex-1 border-t border-dashed border-border" />
      </div>
      {open && summary.trim() ? (
        <div className="rounded-card border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
          <MarkdownPart source={summary} />
        </div>
      ) : null}
    </div>
  )
}
