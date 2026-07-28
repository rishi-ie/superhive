import type { ResponseBlock, TimelineItem, ToolCallTimelineItem } from '@/models/assistant-message'
import { formatToolName, getToolDisplay } from './message-parts/chain-display'

export interface ActivityStatus {
  id: string
  label: string
  pastLabel: string
  kind: 'thinking' | 'activity' | 'tool' | 'writing' | 'warning' | 'error'
  source?: TimelineItem
}

export interface ResponseSegment {
  block: ResponseBlock
  statusBefore?: ActivityStatus
}

export type AuditEvent =
  | { type: 'status'; status: ActivityStatus }
  | { type: 'prose'; block: ResponseBlock }

type OrderedEvent =
  | { type: 'status'; item: TimelineItem; order: number; index: number }
  | { type: 'prose'; block: ResponseBlock; order: number; index: number }

function toolLabel(item: ToolCallTimelineItem, context?: string): string {
  const verb = getToolDisplay(item.toolName)?.liveVerb ?? `Using ${formatToolName(item.toolName)}`
  const action = item.target ? `${verb} ${item.target}` : verb
  return context ? `${context} — ${action.charAt(0).toLowerCase()}${action.slice(1)}` : action
}

function pastToolLabel(item: ToolCallTimelineItem): string {
  const verb = getToolDisplay(item.toolName)?.verb ?? formatToolName(item.toolName)
  return item.target ? `${verb} ${item.target}` : verb
}

function statusFor(item: TimelineItem, context?: string): ActivityStatus | null {
  if (item.kind === 'thinking') {
    return {
      id: item.id,
      kind: 'thinking',
      label: 'Thinking through the next step…',
      pastLabel: 'Thought through the next step',
      source: item,
    }
  }
  if (item.kind === 'planning') {
    return { id: item.id, kind: 'activity', label: item.summary, pastLabel: `Activity — ${item.summary}`, source: item }
  }
  if (item.kind === 'tool-call') {
    return { id: item.id, kind: 'tool', label: toolLabel(item, context), pastLabel: pastToolLabel(item), source: item }
  }
	if (item.kind === 'warning' || item.kind === 'error') {
		return { id: item.id, kind: item.kind, label: item.message, pastLabel: item.message, source: item }
	}
  return null
}

function orderedEvents(timeline: TimelineItem[], response: ResponseBlock[]): OrderedEvent[] {
  const events: OrderedEvent[] = [
    ...timeline.map((item, index) => ({
      type: 'status' as const,
      item,
      order: item.sequence ?? ('startedAt' in item ? item.startedAt : 0),
      index,
    })),
    ...response.map((block, index) => ({
      type: 'prose' as const,
      block,
      order: block.sequence ?? block.startedAt,
      index: timeline.length + index,
    })),
  ]
  return events.sort((a, b) => a.order - b.order || a.index - b.index)
}

/**
 * Turns the raw Pi event surfaces into the user-facing response lineage.
 * A status is intentionally retained only when prose follows it; otherwise
 * State 1 shows just the current status instead of accumulating noise.
 */
export function buildResponseRunView(timeline: TimelineItem[], response: ResponseBlock[]) {
  const segments: ResponseSegment[] = []
  const auditEvents: AuditEvent[] = []
  let pendingStatus: ActivityStatus | undefined
  let activityContext: string | undefined

  for (const event of orderedEvents(timeline, response)) {
    if (event.type === 'status') {
      const status = statusFor(event.item, activityContext)
      if (!status) continue
      if (event.item.kind === 'planning') activityContext = event.item.summary
      pendingStatus = status
      auditEvents.push({ type: 'status', status })
      continue
    }

    if (event.block.type === 'text' && !event.block.text) continue
    auditEvents.push({ type: 'prose', block: event.block })
    segments.push({
      block: event.block,
      ...(pendingStatus?.kind !== 'writing' ? { statusBefore: pendingStatus } : {}),
    })
    pendingStatus = {
      id: `writing-${event.block.sequence ?? event.block.startedAt}`,
      kind: 'writing',
      label: 'Writing the response…',
      pastLabel: 'Wrote response',
    }
  }

  return {
    segments,
    auditEvents,
    liveStatus: pendingStatus ?? {
      id: 'preparing',
      kind: 'activity' as const,
      label: 'Preparing the response…',
      pastLabel: 'Prepared response',
    },
  }
}
