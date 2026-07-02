/**
 * Pure activity event transformation logic extracted from data/activity/store.ts.
 * These helpers convert heterogeneous domain records into ActivityEvent records
 * and merge/sort the unified feed. They do NOT call DataSource directly.
 */
import type { ActivityEvent } from '@/data/activity/interface';

export type SwarmActivityLike = {
  id: string;
  timestamp: string;
  primaryAgent: string;
  action: string;
  targetAgent: string;
  context: string;
};

export type AuditItemLike = {
  id: string;
  type: 'AUTH_INTERCEPT' | 'DIFF_REVIEW';
  title: string;
  timestamp: string;
  agentId: string;
};

export type PendingQuestionLike = {
  id: string;
  agentId: string;
  question: string;
  timestamp: string;
};

/**
 * Truncates a message to a maximum length with an ellipsis suffix.
 * @param text - Input text
 * @param max - Maximum length before truncation (default 80)
 * @returns Truncated text
 */
export function truncateMessage(text: string, max: number = 80): string {
  return text.length > max ? text.slice(0, max) + '…' : text;
}

/**
 * Maps swarm activity to a normalized activity event.
 * @param sa - Source swarm activity record
 * @param workspaceId - Workspace id the event belongs to
 * @returns A normalized activity event
 */
export function swarmToEvent(sa: SwarmActivityLike, workspaceId: string): ActivityEvent {
  return {
    id: sa.id,
    kind: 'swarm_handoff',
    workspaceId,
    timestamp: sa.timestamp,
    actor: sa.primaryAgent,
    target: sa.targetAgent,
    message: `${sa.action} — ${sa.context}`,
    ref: { type: 'agent', id: sa.primaryAgent, workspaceId },
  };
}

/**
 * Maps audit items to activity events.
 * @param a - Source audit record
 * @param workspaceId - Workspace id the event belongs to
 * @returns A normalized activity event
 */
export function auditToEvent(a: AuditItemLike, workspaceId: string): ActivityEvent {
  return {
    id: a.id,
    kind: a.type === 'AUTH_INTERCEPT' ? 'audit_auth' : 'audit_diff',
    workspaceId,
    timestamp: a.timestamp,
    actor: a.agentId,
    actorId: a.agentId,
    message: a.title,
    ref: { type: 'audit', id: a.id, workspaceId },
  };
}

/**
 * Maps pending questions to activity events.
 * @param q - Source pending question
 * @param workspaceId - Workspace id the event belongs to
 * @returns A normalized activity event
 */
export function questionToEvent(q: PendingQuestionLike, workspaceId: string): ActivityEvent {
  return {
    id: q.id,
    kind: 'question_pending',
    workspaceId,
    timestamp: q.timestamp,
    actor: q.agentId,
    actorId: q.agentId,
    message: truncateMessage(q.question),
    ref: { type: 'agent', id: q.agentId, workspaceId },
  };
}

/**
 * Merges new events into the feed, skipping any whose id already exists.
 * @param events - Existing events in the feed
 * @param incoming - New events to add (will be deduped by id)
 * @returns A new array (does not mutate input)
 */
export function mergeUniqueEvents(events: ActivityEvent[], incoming: ActivityEvent[]): ActivityEvent[] {
  const ids = new Set(events.map((e) => e.id));
  const result = [...events];
  for (const ev of incoming) {
    if (!ids.has(ev.id)) result.push(ev);
  }
  return result;
}

/**
 * Sorts events newest-first by timestamp.
 * @param events - Events to sort
 * @returns A new sorted array
 */
export function sortEventsNewestFirst(events: ActivityEvent[]): ActivityEvent[] {
  return [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

/**
 * Limits the feed to a maximum number of events.
 * @param events - Events to slice
 * @param limit - Maximum count
 * @returns The first `limit` events
 */
export function limitEvents(events: ActivityEvent[], limit: number): ActivityEvent[] {
  return events.slice(0, limit);
}
