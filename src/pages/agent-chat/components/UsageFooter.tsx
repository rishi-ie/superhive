import * as React from 'react'
import type { MessageUsage } from '@/models/runtime'

interface UsageFooterProps {
  usage: MessageUsage
}

export function UsageFooter({ usage }: UsageFooterProps) {
  const [open, setOpen] = React.useState(false)
  const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n))
  const cost = usage.cost

  return (
    <div className="ml-auto flex items-center gap-2 text-[11px] text-muted-foreground">
      <span className="font-mono">
        ↑{fmt(usage.input)} ↓{fmt(usage.output)}
        {usage.cacheRead ? ` R${fmt(usage.cacheRead)}` : ''}
      </span>
      {cost != null ? <span className="font-mono">${cost.toFixed(2)}</span> : null}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-muted-foreground hover:text-foreground cursor-pointer"
        aria-expanded={open}
        aria-label="Toggle usage details"
      >
        {open ? '−' : '+'}
      </button>
      {open ? (
        <span className="font-mono text-[10px] text-muted-foreground/80">
          total {fmt(usage.totalTokens)}
          {usage.cacheWrite ? ` · W${fmt(usage.cacheWrite)}` : ''}
        </span>
      ) : null}
    </div>
  )
}
