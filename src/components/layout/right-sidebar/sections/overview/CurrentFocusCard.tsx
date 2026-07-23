/**
 * `CurrentFocusCard` — project-level priorities maintained by the
 * coordinator. Bullets only, no checkboxes, no editing, no card chrome.
 *
 * Mock-driven for now. Future source: a truth setting on the coordinator
 * (e.g. `project.focus: string[]`).
 */

import { Target } from 'lucide-react'

interface CurrentFocusCardProps {
  items: string[]
}

export function CurrentFocusCard({ items }: CurrentFocusCardProps) {
  if (items.length === 0) {
    return (
      <span className="text-xs text-muted-foreground/70">
        Coordinator has not set priorities yet.
      </span>
    )
  }
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <Target className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
          <span className="text-xs text-foreground/80">{item}</span>
        </li>
      ))}
    </ul>
  )
}
