/**
 * Activity stream types — unified feed of events across all domains.
 */

/**
 * Kinds of activity events. Each maps to a specific icon/color in the feed.
 */
export type ActivityKind =
  | 'agent_executing'
  | 'agent_compiling'
  | 'agent_awaiting_human'
  | 'agent_error_loop'
  | 'agent_idle'
  | 'ticket_created'
  | 'ticket_executing'
  | 'ticket_review'
  | 'ticket_merged'
  | 'audit_auth'
  | 'audit_diff'
  | 'question_pending'
  | 'channel_message'
  | 'swarm_handoff';

/**
 * A single activity event in the unified feed.
 * Clickable refs allow the feed row to navigate to the relevant entity.
 */
export type ActivityEvent = {
  id: string;
  kind: ActivityKind;
  workspaceId: string;
  /** ISO timestamp — used for sorting and relative time display. */
  timestamp: string;
  /** Primary actor name (e.g. agent name, or "System"). */
  actor: string;
  /** Optional actor ID for navigation. */
  actorId?: string;
  /** Secondary participant (e.g. target agent name, ticket id short-code). */
  target?: string;
  /** Human-readable summary: "Elena merged UT-114 — pulse-cycle v2.1". */
  message: string;
  /** Navigation ref — clicking the row navigates here. */
  ref?: {
    type: 'ticket' | 'agent' | 'channel' | 'audit';
    id: string;
    workspaceId?: string;
  };
};

export type ActivityFilter = 'all' | 'agents' | 'tickets' | 'audits' | 'channels';

export type ListActivityOpts = {
  workspaceId?: string;
  limit?: number;
  filter?: ActivityFilter;
};
