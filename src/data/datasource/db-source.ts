/**
 * DbDataSource — libSQL-backed implementation of DataSource.
 *
 * Schema lives in <userData>/.superhive/data.db (local file) or at LIBSQL_URL (Turso hosted).
 *
 * libSQL client runs in Electron main process; renderer communicates via IPC
 * (window.electron.dbQuery / dbExecute / dbBatch).
 *
 * Note: after the settings-page wipe, this module provides the schema boot
 * (tables created on first launch) but no domain collections are populated.
 * The DataSource interface is satisfied with stub implementations.
 */
import type { DataSource, Collection } from './types';
import type { Workspace } from '@/data/workspaces/interface';
import type { Project, ChannelMessage } from '@/data/projects/interface';
import type { UniversalTicket } from '@/data/tickets/interface';
import type { Agent, Telemetry, Permissions, AuditItem, PendingQuestion } from '@/data/agents/interface';
import type { Theme } from '@/data/settings/interface';
import type { ActivityEvent } from '@/data/activity/interface';
import type { ChatThread, ChatQuickStartItem } from '@/data/chat/interface';
import type { FavoriteRef } from '@/data/favorites/interface';
import type { CostUsageEntry } from '@/data/cost-usage/interface';
import { SCHEMA, SCHEMA_VERSION } from './schema';
import type {
  TelemetryCollection,
  PermissionsCollection,
  ActionLogCollection,
  NextStepsCollection,
  CostUsageCollection,
  AuditItemsCollection,
  PendingQuestionsCollection,
  ChannelMessagesCollection,
  ChatQuickStartCollection,
} from './types';

type Row = Record<string, unknown>;

function asArray<T>(rows: unknown): T[] {
  return Array.isArray(rows) ? (rows as T[]) : [];
}

function emptyCollection<T extends { id: string }>(): Collection<T> {
  return {
    findAll: () => [],
    findById: () => undefined,
    create: (r) => ({ id: crypto.randomUUID(), ...r } as T),
    update: () => undefined,
    delete: () => false,
  };
}

export class DbDataSource implements DataSource {
  async load(): Promise<void> {
    try {
      let needsFullMigration = false;
      try {
        const verRows = await window.electron.dbQuery(
          "SELECT v FROM schema_meta WHERE k = 'version'",
        );
        const currentVer = asArray<Row>(verRows.rows)[0]?.v as string | undefined;
        needsFullMigration = currentVer !== String(SCHEMA_VERSION);
      } catch {
        needsFullMigration = true;
      }

      if (needsFullMigration) {
        const tablesToDrop = [
          'schema_meta', 'meta', 'kv',
          'workspaces', 'workspace_agents', 'projects', 'project_agents', 'agent_processes',
          'integrations', 'integration_channels', 'permission_requests', 'sub_agents',
          'channel_participants', 'agents', 'universal_tickets',
          'chat_threads', 'favorites', 'custom_themes', 'home_activity_events',
          'telemetry', 'permissions', 'action_logs', 'next_steps',
          'cost_usage', 'audit_items', 'pending_questions',
          'channel_messages', 'chat_quick_start',
          'agent_telemetry', 'agent_permissions', 'agent_action_log',
          'agent_next_step', 'current_workspace', 'agent_defaults',
        ];
        await window.electron.dbBatch(
          tablesToDrop.map((t) => ({ sql: `DROP TABLE IF EXISTS ${t}` })),
        );
        const stmts = SCHEMA.split(';').map((s) => s.trim()).filter(Boolean);
        await window.electron.dbBatch(stmts.map((sql) => ({ sql })));
        await window.electron.dbExecute(
          "INSERT OR REPLACE INTO schema_meta (k, v) VALUES ('version', ?)",
          [String(SCHEMA_VERSION)],
        );
      }
    } catch (err) {
      console.warn('[DbDataSource] load failed:', err);
    }
  }

  subscribe(): () => void {
    return () => {};
  }

  get workspaces(): Collection<Workspace> { return emptyCollection(); }
  get workspaceAgents() {
    type WA = { workspaceId: string; agentId: string; role: string | null; joinedAt: string };
    return {
      findAll: (): WA[] => [],
      create: (r: Partial<WA> & { workspaceId: string; agentId: string }): WA =>
        ({ workspaceId: r.workspaceId!, agentId: r.agentId!, role: r.role ?? null, joinedAt: r.joinedAt! }),
      delete: () => false,
    };
  }
  get projectAgents() {
    type PA = { projectId: string; agentId: string; role: string | null; currentStatus: string; assignedTicketId: string | null; joinedAt: string; contextSnapshotPath: string | null };
    return {
      findAll: (): PA[] => [],
      create: (r: Partial<PA> & { projectId: string; agentId: string }): PA =>
        ({ projectId: r.projectId!, agentId: r.agentId!, role: r.role ?? null, currentStatus: r.currentStatus ?? 'IDLE', assignedTicketId: r.assignedTicketId ?? null, joinedAt: r.joinedAt ?? new Date().toISOString(), contextSnapshotPath: r.contextSnapshotPath ?? null }),
      delete: () => false,
    };
  }
  get agentProcesses() {
    type AP = { ulid: string; pid: number | null; status: string; lastHeartbeatAt: string | null; startedAt: string; port: number | null; workspaceId: string | null; projectId: string | null };
    return {
      findAll: (): AP[] => [],
      findByUlid: () => undefined,
      upsert: (r: Partial<AP> & { ulid: string }): AP =>
        ({ ulid: r.ulid, pid: r.pid ?? null, status: r.status ?? 'STARTING', lastHeartbeatAt: r.lastHeartbeatAt ?? null, startedAt: r.startedAt ?? new Date().toISOString(), port: r.port ?? null, workspaceId: r.workspaceId ?? null, projectId: r.projectId ?? null }),
      setStatus: () => {},
      recordHeartbeat: () => {},
      remove: () => false,
    };
  }
  get integrations() {
    type I = { id: string; provider: string; label: string; connected: boolean; apiKey: string | null; baseUrl: string | null; configJson: string | null; updatedAt: string };
    return {
      findAll: (): I[] => [],
      findById: () => undefined,
      upsert: (id: string, patch: Partial<Omit<I, 'id'>>): I =>
        ({ id, provider: patch.provider ?? '', label: patch.label ?? '', connected: patch.connected ?? false, apiKey: patch.apiKey ?? null, baseUrl: patch.baseUrl ?? null, configJson: patch.configJson ?? null, updatedAt: patch.updatedAt ?? new Date().toISOString() }),
    };
  }
  get integrationChannels() {
    type IC = { id: string; integrationId: string; name: string; eventsJson: string };
    return {
      findAll: (): IC[] => [],
      findByIntegrationId: (_integrationId: string): IC[] => [],
      create: (r: Omit<IC, 'id'>): IC => ({ id: crypto.randomUUID(), ...r }),
      remove: () => false,
    };
  }
  get permissionRequests() {
    type PR = { id: string; agentUlid: string; action: string; toolName: string | null; argsJson: string | null; status: string; requestedAt: string; resolvedAt: string | null; resolverNote: string | null };
    return {
      findAll: (): PR[] => [],
      findById: () => undefined,
      create: (r: Omit<PR, 'id'>): PR => ({ id: crypto.randomUUID(), ...r }),
      resolve: () => {},
      listByAgent: (_agentUlid: string): PR[] => [],
    };
  }
  get subAgents() {
    type SA = { id: string; parentUlid: string; name: string; kind: string; status: string; startedAt: string; finishedAt: string | null; task: string | null };
    return {
      findAll: (): SA[] => [],
      findById: () => undefined,
      create: (r: Omit<SA, 'id'>): SA => ({ id: crypto.randomUUID(), ...r }),
      setStatus: () => {},
      finish: () => {},
      listByParent: (_parentUlid: string): SA[] => [],
    };
  }
  get channelParticipants() {
    type CP = { channelId: string; agentId: string; participantType: string; canRead: boolean; canWrite: boolean; joinedAt: string };
    return {
      findAll: (): CP[] => [],
      findByChannelId: (_channelId: string): CP[] => [],
      create: (r: Omit<CP, 'channelId' | 'agentId' | 'participantType'> & { channelId: string; agentId: string; participantType: string }): CP => ({ ...r }),
      remove: () => false,
      updatePermissions: () => {},
    };
  }
  get projects(): Collection<Project> { return emptyCollection(); }
  get agents(): Collection<Agent> { return emptyCollection(); }
  get tickets(): Collection<UniversalTicket> { return emptyCollection(); }
  get chat(): Collection<ChatThread> { return emptyCollection(); }
  get favorites(): Collection<FavoriteRef> { return emptyCollection(); }
  get themes(): Collection<Theme> { return emptyCollection(); }
  get activity(): Collection<ActivityEvent> { return emptyCollection(); }
  get telemetry(): TelemetryCollection {
    return {
      findAll: () => [] as { id: string; agentId: string; contextSaturation: number; tokensPerSecond: number; currentCost: number; evolutionLoop: string; logicKernelIntegrity: number; sessionCost: number; budget: number }[],
      findByAgentId: () => undefined,
      upsert: (agentId: string, patch: Partial<Telemetry>) => {
        const t: Telemetry = { agentId, contextSaturation: 50, tokensPerSecond: 0, currentCost: 0, evolutionLoop: '0/100', logicKernelIntegrity: 100, sessionCost: 0, budget: 5, ...patch };
        return { id: `telemetry:${agentId}`, ...t };
      },
    };
  }
  get permissions(): PermissionsCollection {
    return {
      findAll: () => [] as { id: string; agentId: string; modelEngine: string; writeAccess: boolean; commitAuthority: string; maxTokens: number; writeMessages: boolean; installDeps: boolean }[],
      findByAgentId: () => undefined,
      upsert: (agentId: string, patch: Partial<Permissions>) => {
        const p: Permissions = { agentId, modelEngine: 'Opus 4.8', writeAccess: false, commitAuthority: 'REVIEW_ONLY', maxTokens: 8192, writeMessages: false, installDeps: false, ...patch };
        return { id: `permissions:${agentId}`, ...p };
      },
    };
  }
  get actionLogs(): ActionLogCollection {
    return {
      findAll: () => [] as { id: string; agentId: string; time: string; action: string }[],
      findByAgentId: () => [],
      push: (agentId, entry) => ({ id: crypto.randomUUID(), agentId, time: entry.time, action: entry.action }),
    };
  }
  get nextSteps(): NextStepsCollection {
    return {
      findAll: () => [] as { id: string; agentId: string; step: string }[],
      findByAgentId: () => undefined,
      upsert: (agentId, step) => ({ id: `nextStep:${agentId}`, agentId, step }),
    };
  }
  get costUsage(): CostUsageCollection { return { findAll: () => [] as CostUsageEntry[] }; }
  get auditItems(): AuditItemsCollection {
    return {
      findAll: () => [] as AuditItem[],
      findByAgentId: () => [],
      delete: () => false,
    };
  }
  get pendingQuestions(): PendingQuestionsCollection {
    return {
      findAll: () => [] as PendingQuestion[],
      findByAgentId: () => [],
      delete: () => false,
    };
  }
  get channelMessages(): ChannelMessagesCollection {
    return {
      findAll: () => [] as ChannelMessage[],
      findByChannelId: () => [],
      create: (msg) => ({ ...msg }),
    };
  }
  get chatQuickStart(): ChatQuickStartCollection {
    return { findAll: () => [] as ChatQuickStartItem[] };
  }

  get currentWorkspaceId(): string { return ''; }
}

export const dbDataSource = new DbDataSource();

export async function bootDataSource(): Promise<void> {
  await dbDataSource.load();
}

export const getDataSource = (): DataSource => dbDataSource;
