/**
 * Activity store — unified, timestamped activity feed derived from all domain stores.
 *
 * Sources aggregated:
 *   1. DataSource.activity              — primary seed
 *   2. SwarmActivity from all projects  — swarm_handoff flavor
 *   3. AuditItem / PendingQuestion     — audit_*, question_pending
 */
import { getDataSource } from '@/data/datasource/index';
import { listSwarmActivity } from '@/data/projects/store';
import { listAgents, getAuditItems, getPendingQuestions } from '@/data/agents/store';
import { listWorkspaces } from '@/data/workspaces/store';
import type { ActivityEvent, ActivityKind, ListActivityOpts } from './interface';

/* ─── SwarmActivity → ActivityEvent ───────────────────────────────── */

function swarmToEvent(
  sa: { id: string; timestamp: string; primaryAgent: string; action: string; targetAgent: string; context: string },
  workspaceId: string,
): ActivityEvent {
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

/* ─── AuditItem → ActivityEvent ───────────────────────────────────── */

function auditToEvent(
  a: { id: string; type: 'AUTH_INTERCEPT' | 'DIFF_REVIEW'; title: string; timestamp: string; agentId: string },
  workspaceId: string,
): ActivityEvent {
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

/* ─── PendingQuestion → ActivityEvent ──────────────────────────────── */

function questionToEvent(
  q: { id: string; agentId: string; question: string; timestamp: string },
  workspaceId: string,
): ActivityEvent {
  return {
    id: q.id,
    kind: 'question_pending',
    workspaceId,
    timestamp: q.timestamp,
    actor: q.agentId,
    actorId: q.agentId,
    message: q.question.length > 80 ? q.question.slice(0, 80) + '…' : q.question,
    ref: { type: 'agent', id: q.agentId, workspaceId },
  };
}

/* ─── Build unified feed ───────────────────────────────────────────── */

function buildFeed(opts: ListActivityOpts = {}): ActivityEvent[] {
  const { workspaceId, limit = 50 } = opts;
  const events: ActivityEvent[] = [];

  const workspaces = workspaceId
    ? listWorkspaces().filter((w) => w.id === workspaceId)
    : listWorkspaces();

  const wsIds = new Set(workspaces.map((w) => w.id));

  // 1. Activity seed from DataSource
  for (const ev of getDataSource().activity.findAll()) {
    if (!wsIds.has(ev.workspaceId)) continue;
    events.push(ev);
  }

  // 2. SwarmActivity from all projects
  for (const ws of workspaces) {
    const swarm = listSwarmActivity(ws.id);
    for (const sa of swarm) {
      if (!events.some((e) => e.id === sa.id)) {
        events.push(swarmToEvent(sa, ws.id));
      }
    }
  }

  // 3. AuditItems
  for (const ws of workspaces) {
    const agents = listAgents();
    for (const agent of agents) {
      const audits = getAuditItems(agent.id);
      for (const a of audits) {
        if (!events.some((e) => e.id === a.id)) {
          events.push(auditToEvent(a, ws.id));
        }
      }
    }
  }

  // 4. PendingQuestions
  for (const ws of workspaces) {
    const agents = listAgents();
    for (const agent of agents) {
      const questions = getPendingQuestions(agent.id);
      for (const q of questions) {
        if (!events.some((e) => e.id === q.id)) {
          events.push(questionToEvent(q, ws.id));
        }
      }
    }
  }

  // Sort newest-first
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return events.slice(0, limit);
}

/* ─── Public API ──────────────────────────────────────────────────── */

export function listActivity(opts: ListActivityOpts = {}): ActivityEvent[] {
  return buildFeed(opts);
}

export type { ActivityEvent, ActivityKind, ListActivityOpts };
