import type { TimelineItem, ToolCallTimelineItem } from '@/models/assistant-message'

export type TimelineGroup =
  | { kind: 'single'; item: Exclude<TimelineItem, ToolCallTimelineItem> }
  | { kind: 'tool-group'; items: ToolCallTimelineItem[] }

/**
 * Walk the timeline and cluster consecutive tool-call items into a single
 * group. Non-tool-call items break the chain.
 *
 * Legacy `CompletionTimelineItem`s are still in the type union (for
 * forward compat with on-disk messages written before the queue stopped
 * emitting them). Drop them here so they don't show up as standalone
 * rows in the lineage.
 */
export function groupTimelineItems(items: TimelineItem[]): TimelineGroup[] {
  const groups: TimelineGroup[] = []
  for (const item of items) {
    if (item.kind === 'completion') continue
    const last = groups[groups.length - 1]
    if (item.kind === 'tool-call' && last?.kind === 'tool-group') {
      last.items.push(item)
    } else if (item.kind === 'tool-call') {
      groups.push({ kind: 'tool-group', items: [item] })
    } else {
      groups.push({ kind: 'single', item })
    }
  }
  return groups
}