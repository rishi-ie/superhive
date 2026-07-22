/**
 * `AttentionCard` — one row in the "Needs Your Attention" list.
 *
 * Mock-driven for now. Future source: orchestrator mailbox / inbox
 * (the coordinator raises questions here when it needs a human).
 */

import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AttentionItem } from '@/models/component'

interface AttentionCardProps {
  item: AttentionItem
}

export function AttentionCard({ item }: AttentionCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-button border border-border bg-card px-3 py-3">
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-foreground/90">
            {item.title}
          </span>
          <span className="text-xs text-muted-foreground">{item.description}</span>
        </div>
      </div>
      <div className="flex justify-end">
        <Button variant="outline" size="sm">
          {item.actionLabel}
        </Button>
      </div>
    </div>
  )
}
