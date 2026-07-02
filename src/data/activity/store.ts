/**
 * Activity store — unified, timestamped activity feed derived from all domain stores.
 *
 * Sources aggregated:
 *   1. DataSource.activity              — primary seed
 *   2. SwarmActivity from all projects  — swarm_handoff flavor
 *   3. AuditItem / PendingQuestion     — audit_*, question_pending
 *
 * Conversion and merge logic lives in @/functions/activity.
 */
import { getDataSource } from '@/data/datasource/index';
import { listSwarmActivity } from '@/data/project/store';
import { listAgents, getAuditItems, getPendingQuestions } from '@/data/agent/store';
import { listWorkspaces } from '@/data/workspace/store';
import {
  swarmToEvent,
  auditToEvent,
  questionToEvent,
  mergeUniqueEvents,
  sortEventsNewestFirst,
  limitEvents,
} from '@/functions/activity';
import type { ActivityEvent, ActivityKind, ListActivityOpts } from './interface';

/* ─── Build unified feed ───────────────────────────────────────────── */

function buildFeed(opts: ListActivityOpts = {}): ActivityEvent[] {
  const { workspaceId, limit = 50 } = opts;

  const workspaces = workspaceId
    ? listWorkspaces().filter((w) => w.id === workspaceId)
    : listWorkspaces();

  const wsIds = new Set(workspaces.map((w) => w.id));

  // 1. Activity seed from DataSource
  let events: ActivityEvent[] = [];
  for (const ev of getDataSource().activity.findAll()) {
    if (!wsIds.has(ev.workspaceId)) continue;
    events.push(ev);
  }

  // 2. SwarmActivity from all projects
  for (const ws of workspaces) {
    const swarm = listSwarmActivity(ws.id);
    events = mergeUniqueEvents(events, swarm.map((sa) => swarmToEvent(sa, ws.id)));
  }

  // 3. AuditItems
  for (const ws of workspaces) {
    const agents = listAgents();
    const auditEvents: ActivityEvent[] = [];
    for (const agent of agents) {
      const audits = getAuditItems(agent.id);
      for (const a of audits) {
        auditEvents.push(auditToEvent(a, ws.id));
      }
    }
    events = mergeUniqueEvents(events, auditEvents);
  }

  // 4. PendingQuestions
  for (const ws of workspaces) {
    const agents = listAgents();
    const questionEvents: ActivityEvent[] = [];
    for (const agent of agents) {
      const questions = getPendingQuestions(agent.id);
      for (const q of questions) {
        questionEvents.push(questionToEvent(q, ws.id));
      }
    }
    events = mergeUniqueEvents(events, questionEvents);
  }

  return limitEvents(sortEventsNewestFirst(events), limit);
}

/* ─── Public API ──────────────────────────────────────────────────── */

export function listActivity(opts: ListActivityOpts = {}): ActivityEvent[] {
  return buildFeed(opts);
}

export type { ActivityEvent, ActivityKind, ListActivityOpts };
