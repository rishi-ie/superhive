import type { TimelineItem, ToolCallTimelineItem } from '@/models/assistant-message'

export type TimelineGroup =
  | { kind: 'single'; item: Exclude<TimelineItem, ToolCallTimelineItem> }
  | { kind: 'tool-group'; items: ToolCallTimelineItem[] }

/**
 * Walk the timeline and cluster consecutive tool-call items into a single
 * group. Non-tool-call items break the chain.
 */
export function groupTimelineItems(items: TimelineItem[]): TimelineGroup[] {
  const groups: TimelineGroup[] = []
  for (const item of items) {
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