/**
 * `ActivityFeed` — chronological feed of recent project events.
 *
 * Mock-driven for now. Future source: orchestrator / telemetry journal
 * (`<agentDir>/telemetry.jsonl`).
 */

import { Activity } from 'lucide-react'
import type { ActivityItem } from '@/models/component'

interface ActivityFeedProps {
  items: ActivityItem[]
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <span className="text-xs text-muted-foreground/70">No recent activity.</span>
    )
  }
  return (
    <ul className="flex flex-col">
      {items.map((item, i) => (
        <li
          key={item.id}
          className={
            'flex items-start gap-3 py-2 ' +
            (i < items.length - 1 ? 'border-b border-border/40' : '')
          }
        >
          <Activity className="mt-0.5 size-3 shrink-0 text-muted-foreground/60" />
          <span className="flex-1 text-xs text-foreground/80">{item.text}</span>
          <span className="shrink-0 text-xs text-muted-foreground/60 tabular-nums">
            {item.time}
          </span>
        </li>
      ))}
    </ul>
  )
}
