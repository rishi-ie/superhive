/**
 * MockDataSource — in-memory implementation of DataSource, seeded from mock.json.
 *
 * All data is loaded synchronously at construction (after normalizeSeedData).
 * Collections hold mutable arrays; mutations are in-memory only.
 * Swap this for DbDataSource to get real persistence — nothing else changes.
 */
import mockData from '@/data/mock.json';
import type { Snapshot } from './snapshot';
import { normalizeSeedData } from './snapshot';
import type { DataSource, Entity, Collection, TelemetryCollection, PermissionsCollection, ActionLogCollection, NextStepsCollection, CostUsageCollection, AuditItemsCollection, PendingQuestionsCollection, ChannelMessagesCollection, ChatQuickStartCollection, TelemetryRecord, PermissionsRecord, ActionLogRecord, NextStepsRecord } from './types';
import type { Workspace } from '@/data/workspaces/interface';
import type { Project } from '@/data/projects/interface';
import type { ChannelMessage } from '@/data/projects/interface';
import type { UniversalTicket } from '@/data/tickets/interface';
import type { Agent, Telemetry, Permissions, AuditItem, ActionLogEntry, PendingQuestion } from '@/data/agents/interface';
import type { Theme } from '@/data/settings/interface';
import type { ActivityEvent } from '@/data/activity/interface';
import type { ChatThread } from '@/data/chat/interface';
import type { FavoriteSeed, ChatQuickStartItem } from '@/data/mock/types';

/* ─── helpers ──────────────────────────────────────────────────────────────── */

function makeId(prefix: string, key: string): string {
  return `${prefix}:${key}`;
}

/* ─── Collection base ──────────────────────────────────────────────────────── */

function createCollection<T extends Entity>(seed: T[]): Collection<T> {
  let items: T[] = seed.map((r) => ({ ...r }));
  return {
    findAll: () => [...items],
    findById: (id) => items.find((r) => r.id === id),
    create: (record) => {
      const item = { id: crypto.randomUUID(), ...record } as T;
      items.push(item);
      return item;
    },
    update: (id, patch) => {
      const idx = items.findIndex((r) => r.id === id);
      if (idx === -1) return undefined;
      items[idx] = { ...items[idx], ...patch } as T;
      return items[idx];
    },
    delete: (id) => {
      const before = items.length;
      items = items.filter((r) => r.id !== id);
      return items.length < before;
    },
  };
}

/* ─── Telemetry map → flat collection ─────────────────────────────────────── */

function createTelemetryCollection(
  seed: Record<string, Telemetry>,
): TelemetryCollection {
  let items: TelemetryRecord[] = Object.entries(seed).map(([agentId, t]) => ({
    id: makeId('telemetry', agentId),
    agentId,
    contextSaturation: t.contextSaturation,
    tokensPerSecond: t.tokensPerSecond,
    currentCost: t.currentCost,
    evolutionLoop: t.evolutionLoop,
    logicKernelIntegrity: t.logicKernelIntegrity,
    sessionCost: t.sessionCost,
    budget: t.budget,
  }));

  return {
    findAll: () => [...items],
    findByAgentId: (agentId) => items.find((r) => r.agentId === agentId),
    upsert: (agentId, patch) => {
      const idx = items.findIndex((r) => r.agentId === agentId);
      if (idx === -1) {
        const rec: TelemetryRecord = {
          id: makeId('telemetry', agentId),
          agentId,
          contextSaturation: 50, tokensPerSecond: 0, currentCost: 0,
          evolutionLoop: '0/100', logicKernelIntegrity: 100, sessionCost: 0, budget: 5,
          ...patch,
        };
        items.push(rec);
        return rec;
      }
      items[idx] = { ...items[idx], ...patch } as TelemetryRecord;
      return items[idx];
    },
  };
}

/* ─── Permissions map → flat collection ─────────────────────────────────────── */

function createPermissionsCollection(
  seed: Record<string, Permissions>,
): PermissionsCollection {
  let items: PermissionsRecord[] = Object.entries(seed).map(([agentId, p]) => ({
    id: makeId('permissions', agentId),
    agentId,
    modelEngine: p.modelEngine,
    writeAccess: p.writeAccess,
    commitAuthority: p.commitAuthority,
    maxTokens: p.maxTokens,
    writeMessages: p.writeMessages,
    installDeps: p.installDeps,
  }));

  return {
    findAll: () => [...items],
    findByAgentId: (agentId) => items.find((r) => r.agentId === agentId),
    upsert: (agentId, patch) => {
      const idx = items.findIndex((r) => r.agentId === agentId);
      if (idx === -1) {
        const rec: PermissionsRecord = {
          id: makeId('permissions', agentId),
          agentId,
          modelEngine: 'Opus 4.8', writeAccess: false, commitAuthority: 'REVIEW_ONLY',
          maxTokens: 8192, writeMessages: false, installDeps: false,
          ...patch,
        };
        items.push(rec);
        return rec;
      }
      items[idx] = { ...items[idx], ...patch } as PermissionsRecord;
      return items[idx];
    },
  };
}

/* ─── ActionLog map → flat collection ─────────────────────────────────────── */

function createActionLogCollection(
  seed: Record<string, ActionLogEntry[]>,
): ActionLogCollection {
  let items: ActionLogRecord[] = Object.entries(seed).flatMap(([agentId, entries]) =>
    entries.map((e) => ({ id: crypto.randomUUID(), agentId, time: e.time, action: e.action })),
  );

  return {
    findAll: () => [...items],
    findByAgentId: (agentId) => items.filter((r) => r.agentId === agentId),
    push: (agentId, entry) => {
      const rec: ActionLogRecord = {
        id: crypto.randomUUID(),
        agentId,
        time: entry.time,
        action: entry.action,
      };
      items.push(rec);
      return rec;
    },
  };
}

/* ─── NextSteps map → flat collection ─────────────────────────────────────── */

function createNextStepsCollection(
  seed: Record<string, string>,
): NextStepsCollection {
  let items: NextStepsRecord[] = Object.entries(seed).map(([agentId, step]) => ({
    id: makeId('nextStep', agentId),
    agentId,
    step,
  }));

  return {
    findAll: () => [...items],
    findByAgentId: (agentId) => items.find((r) => r.agentId === agentId),
    upsert: (agentId, step) => {
      const idx = items.findIndex((r) => r.agentId === agentId);
      if (idx === -1) {
        const rec: NextStepsRecord = { id: makeId('nextStep', agentId), agentId, step };
        items.push(rec);
        return rec;
      }
      items[idx] = { ...items[idx], step } as NextStepsRecord;
      return items[idx];
    },
  };
}

/* ─── MockDataSource ───────────────────────────────────────────────────────── */

export class MockDataSource implements DataSource {
  public readonly workspaces: Collection<Workspace>;
  public readonly projects: Collection<Project>;
  public readonly agents: Collection<Agent>;
  public readonly tickets: Collection<UniversalTicket>;
  public readonly chat: Collection<ChatThread>;
  public readonly favorites: Collection<FavoriteSeed>;
  public readonly themes: Collection<Theme>;
  public readonly activity: Collection<ActivityEvent>;
  public readonly telemetry: TelemetryCollection;
  public readonly permissions: PermissionsCollection;
  public readonly actionLogs: ActionLogCollection;
  public readonly nextSteps: NextStepsCollection;
  public readonly costUsage: CostUsageCollection;
  public readonly auditItems: AuditItemsCollection;
  public readonly pendingQuestions: PendingQuestionsCollection;
  public readonly channelMessages: ChannelMessagesCollection;
  public readonly chatQuickStart: ChatQuickStartCollection;
  public readonly currentWorkspaceId: string;

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalized = normalizeSeedData(mockData as any) as Snapshot;

    this.workspaces = createCollection(normalized.workspaces);
    this.projects = createCollection(normalized.projects);
    this.agents = createCollection(normalized.agents);
    this.tickets = createCollection(normalized.universalTickets);
    this.chat = createCollection(normalized.chatThreads as unknown as ChatThread[]);
    this.favorites = createCollection(normalized.favorites);
    this.themes = createCollection(normalized.customThemes);
    this.activity = createCollection(normalized.homeActivityEvents);

    this.telemetry = createTelemetryCollection(normalized.telemetry);
    this.permissions = createPermissionsCollection(normalized.permissions);
    this.actionLogs = createActionLogCollection(normalized.actionLogs);
    this.nextSteps = createNextStepsCollection(normalized.nextSteps);
    this.costUsage = { findAll: () => [...normalized.costUsage] };

    const _auditItems: AuditItem[] = [...normalized.auditItems];
    this.auditItems = {
      findAll: () => [..._auditItems],
      findByAgentId: (agentId) => _auditItems.filter((a) => a.agentId === agentId),
      delete: (id) => { const before = _auditItems.length; const idx = _auditItems.findIndex((a) => a.id === id); if (idx !== -1) _auditItems.splice(idx, 1); return _auditItems.length < before; },
    };

    const _pendingQuestions: PendingQuestion[] = [...normalized.pendingQuestions];
    this.pendingQuestions = {
      findAll: () => [..._pendingQuestions],
      findByAgentId: (agentId) => _pendingQuestions.filter((q) => q.agentId === agentId),
      delete: (id) => { const before = _pendingQuestions.length; const idx = _pendingQuestions.findIndex((q) => q.id === id); if (idx !== -1) _pendingQuestions.splice(idx, 1); return _pendingQuestions.length < before; },
    };

    const _channelMessages: ChannelMessage[] = [...normalized.channelMessages];
    this.channelMessages = {
      findAll: () => [..._channelMessages],
      findByChannelId: (channelId) => _channelMessages.filter((m) => m.channelId === channelId),
      create: (msg) => { _channelMessages.push(msg); return msg; },
    };

    const _chatQuickStart: ChatQuickStartItem[] = [...(normalized.chatQuickStart ?? [])];
    this.chatQuickStart = { findAll: () => [..._chatQuickStart] };

    this.currentWorkspaceId = normalized.currentWorkspaceId;
  }

  /** Resolves immediately — data is already in memory. */
  load(): Promise<void> {
    return Promise.resolve();
  }
}

/* ─── Re-exports ───────────────────────────────────────────────────────────── */
export type { Snapshot } from './snapshot';
