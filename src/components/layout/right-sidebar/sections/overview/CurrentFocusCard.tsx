/**
 * `CurrentFocusCard` — project-level priorities maintained by the
 * coordinator. Bullets only, no checkboxes, no editing.
 *
 * Mock-driven for now. Future source: a truth setting on the coordinator
 * (e.g. `project.focus: string[]`).
 */

import { Target } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface CurrentFocusCardProps {
  items: string[]
}

export function CurrentFocusCard({ items }: CurrentFocusCardProps) {
  return (
    <Card size="sm" className="gap-2">
      <CardContent className="flex flex-col gap-1 p-0">
        {items.length === 0 ? (
          <span className="text-xs text-muted-foreground/70">
            Coordinator has not set priorities yet.
          </span>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <Target className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                <span className="text-xs text-foreground/80">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
