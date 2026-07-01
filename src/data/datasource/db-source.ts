/**
 * DbDataSource — libSQL-backed implementation of DataSource.
 *
 * All data lives in <userData>/.superhive/data.db (local file) or at LIBSQL_URL (Turso hosted).
 *
 * libSQL client runs in Electron main process; renderer communicates via IPC
 * (window.electron.dbQuery / dbExecute / dbBatch / dbExecMulti).
 *
 * Architecture:
 *   - private cache fields, populated by load() via SELECT *
 *   - Each getter builds its Collection<T> from the cache on access
 *   - Mutation methods: update cache → fire-and-forget IPC → return immediately
 *   - If db is unavailable (load() failed), cache stays empty, IPC skipped,
 *     app still runs with no data
 *
 * One-shot seed: checked via schema_meta version stamp. On version mismatch the
 * old schema is dropped entirely, fresh SCHEMA applied, and seed.sql executed.
 */
import type { DataSource, Collection } from './types';
import type { Workspace } from '@/data/workspaces/interface';
import type { Project, ChannelMessage } from '@/data/projects/interface';
import type { UniversalTicket } from '@/data/tickets/interface';
import type { Agent, Telemetry, Permissions, AuditItem, PendingQuestion } from '@/data/agents/interface';
import type { Theme } from '@/data/settings/interface';
import type { ActivityEvent } from '@/data/activity/interface';
import type { ChatThread, Message, ChatQuickStartItem } from '@/data/chat/interface';
import type { FavoriteRef } from '@/data/favorites/interface';
import type { CostUsageEntry } from '@/data/cost-usage/interface';
import { SCHEMA, SCHEMA_VERSION } from './schema';
import seedSql from '../seed/seed.sql?raw';
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

export class DbDataSource implements DataSource {
  // ── Hydrated cache ────────────────────────────────────────────────────────
  private _workspaces: Workspace[] = [];
  private _workspaceAgents: Array<{ workspaceId: string; agentId: string; role: string | null; joinedAt: string }> = [];
  private _projects: Project[] = [];
  private _agents: Agent[] = [];
  private _tickets: UniversalTicket[] = [];
  private _chatThreads: ChatThread[] = [];
  private _favorites: FavoriteRef[] = [];
  private _themes: Theme[] = [];
  private _activity: ActivityEvent[] = [];
  private _telemetry = new Map<string, Telemetry>();
  private _permissions = new Map<string, Permissions>();
  private _actionLogs: Array<{ id: string; agentId: string; time: string; action: string }> = [];
  private _nextSteps = new Map<string, string>();
  private _costUsage: CostUsageEntry[] = [];
  private _auditItems: AuditItem[] = [];
  private _pendingQuestions: PendingQuestion[] = [];
  private _channelMessages: ChannelMessage[] = [];
  private _chatQuickStart: ChatQuickStartItem[] = [];
  private _currentWorkspaceId = '';

  private _ready = false;
  private _dbAvailable = true;
  private _listeners = new Set<() => void>();

  // ── Public API ────────────────────────────────────────────────────────────

  subscribe(listener: () => void): () => void {
    this._listeners.add(listener);
    return () => { this._listeners.delete(listener); };
  }

  private _notify(): void {
    this._listeners.forEach((l) => { l(); });
  }

  async load(): Promise<void> {
    if (this._ready) return;
    try {
      // 1. Version check — determine if we need a fresh schema + seed
      let needsFullMigration = false;
      try {
        const verRows = await window.electron.dbQuery(
          "SELECT v FROM schema_meta WHERE k = 'version'",
        );
        const currentVer = asArray<Row>(verRows.rows)[0]?.v as string | undefined;
        needsFullMigration = currentVer !== String(SCHEMA_VERSION);
      } catch {
        // schema_meta table doesn't exist yet — old DB, needs migration
        needsFullMigration = true;
      }

      if (needsFullMigration) {
        // 2a. Drop everything we own (covers legacy schemas: kv, agent_telemetry,
        //     agent_permissions, etc. — no harm dropping tables that don't exist)
        const tablesToDrop = [
          'schema_meta', 'meta', 'kv',
          'workspaces', 'workspace_agents', 'projects', 'agents', 'universal_tickets',
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

        // 2b. Apply full schema
        const stmts = SCHEMA.split(';').map((s) => s.trim()).filter(Boolean);
        await window.electron.dbBatch(stmts.map((sql) => ({ sql })));

        // 2c. Stamp version
        await window.electron.dbExecute(
          "INSERT OR REPLACE INTO schema_meta (k, v) VALUES ('version', ?)",
          [String(SCHEMA_VERSION)],
        );

        // 2d. Seed
        await window.electron.dbExecMulti(seedSql);
      }

      // 3. Hydrate cache
      await this._hydrate();

      this._ready = true;
    } catch (err) {
      console.warn('[DbDataSource] load failed, app will run with empty cache:', err);
      this._dbAvailable = false;
      this._ready = true;
    }
  }

  // ── Hydration ─────────────────────────────────────────────────────────────

  private async _hydrate(): Promise<void> {
    // meta: currentWorkspaceId
    const metaRows = asArray<Row>(
      (await window.electron.dbQuery("SELECT value FROM meta WHERE key = 'currentWorkspaceId'")).rows,
    );
    this._currentWorkspaceId = (metaRows[0]?.value as string | undefined) ?? '';

    // workspaces
    this._workspaces = asArray<Row>(
      (await window.electron.dbQuery('SELECT id, name, initials, avatarColor, created_at, retention_days, archived_at FROM workspaces')).rows,
    ).map((r) => ({
      id: String(r.id),
      name: String(r.name),
      initials: String(r.initials),
      avatarColor: (r.avatarColor as string | null) ?? undefined,
      createdAt: String(r.created_at),
      retentionDays: Number(r.retention_days),
      archivedAt: (r.archived_at as string | null) ?? null,
    }));

    // workspace_agents
    this._workspaceAgents = asArray<Row>(
      (await window.electron.dbQuery('SELECT workspace_id, agent_id, role, joined_at FROM workspace_agents')).rows,
    ).map((r) => ({
      workspaceId: String(r.workspace_id),
      agentId: String(r.agent_id),
      role: (r.role as string | null) ?? null,
      joinedAt: String(r.joined_at),
    }));

    // projects
    const projectRows = asArray<Row>(
      (await window.electron.dbQuery('SELECT data FROM projects')).rows,
    );
    this._projects = projectRows.map((r) => JSON.parse(String(r.data)) as Project);

    // agents
    this._agents = asArray<Row>(
      (await window.electron.dbQuery('SELECT id, name, role, status, activeTask, uptime FROM agents')).rows,
    ).map((r) => ({
      id: String(r.id), name: String(r.name), role: String(r.role),
      status: r.status as Agent['status'],
      activeTask: String(r.activeTask ?? ''), uptime: String(r.uptime ?? ''),
    }));

    // universal_tickets
    this._tickets = asArray<Row>(
      (await window.electron.dbQuery('SELECT id, title, projectName, workspaceId, status, priority, type, assigneeName, assigneeAvatarUrl, assigneeIsAI FROM universal_tickets')).rows,
    ).map((r) => ({
      id: String(r.id), title: String(r.title), projectName: String(r.projectName),
      workspaceId: String(r.workspaceId),
      status: r.status as UniversalTicket['status'],
      priority: r.priority as UniversalTicket['priority'],
      type: r.type as UniversalTicket['type'],
      assignee: {
        name: String(r.assigneeName),
        avatarUrl: (r.assigneeAvatarUrl as string | null) ?? undefined,
        isAI: Number(r.assigneeIsAI) === 1,
      },
    }));

    // chat_threads — JSON-blob messages
    this._chatThreads = asArray<Row>(
      (await window.electron.dbQuery('SELECT id, title, agentId, updatedAt, messages FROM chat_threads')).rows,
    ).map((r) => ({
      id: String(r.id), title: String(r.title),
      agentId: (r.agentId as string | null) ?? undefined,
      updatedAt: new Date(String(r.updatedAt)),
      messages: (JSON.parse(String(r.messages)) as Message[]).map((m) => ({
        ...m,
        timestamp: typeof m.timestamp === 'string' ? new Date(m.timestamp) : m.timestamp,
      })),
    }));

    // favorites
    this._favorites = asArray<Row>(
      (await window.electron.dbQuery('SELECT id, type FROM favorites')).rows,
    ).map((r) => ({ id: String(r.id), type: r.type as FavoriteRef['type'] }));

    // custom_themes
    this._themes = asArray<Row>(
      (await window.electron.dbQuery('SELECT id, name, vars, systemVars FROM custom_themes')).rows,
    ).map((r) => ({
      id: String(r.id), name: String(r.name),
      vars: JSON.parse(String(r.vars)) as Record<string, string>,
      systemVars: r.systemVars ? JSON.parse(String(r.systemVars)) as Record<string, string> : undefined,
    }));

    // home_activity_events
    this._activity = asArray<Row>(
      (await window.electron.dbQuery('SELECT id, kind, workspaceId, timestamp, actor, actorId, target, message, refType, refId, refWorkspaceId FROM home_activity_events')).rows,
    ).map((r) => ({
      id: String(r.id), kind: r.kind as ActivityEvent['kind'],
      workspaceId: String(r.workspaceId), timestamp: String(r.timestamp),
      actor: String(r.actor),
      actorId: (r.actorId as string | null) ?? undefined,
      target: (r.target as string | null) ?? undefined,
      message: String(r.message),
      ref: r.refType ? {
        type: r.refType as 'ticket' | 'agent' | 'channel' | 'audit',
        id: String(r.refId),
        workspaceId: (r.refWorkspaceId as string | null) ?? undefined,
      } : undefined,
    }));

    // telemetry
    this._telemetry.clear();
    for (const r of asArray<Row>(
      (await window.electron.dbQuery('SELECT agentId, contextSaturation, tokensPerSecond, currentCost, evolutionLoop, logicKernelIntegrity, sessionCost, budget FROM telemetry')).rows,
    )) {
      this._telemetry.set(String(r.agentId), {
        contextSaturation: Number(r.contextSaturation),
        tokensPerSecond: Number(r.tokensPerSecond),
        currentCost: Number(r.currentCost),
        evolutionLoop: String(r.evolutionLoop),
        logicKernelIntegrity: Number(r.logicKernelIntegrity),
        sessionCost: Number(r.sessionCost),
        budget: Number(r.budget),
      });
    }

    // permissions
    this._permissions.clear();
    for (const r of asArray<Row>(
      (await window.electron.dbQuery('SELECT agentId, modelEngine, writeAccess, commitAuthority, maxTokens, writeMessages, installDeps FROM permissions')).rows,
    )) {
      this._permissions.set(String(r.agentId), {
        modelEngine: String(r.modelEngine),
        writeAccess: Number(r.writeAccess) === 1,
        commitAuthority: r.commitAuthority as Permissions['commitAuthority'],
        maxTokens: Number(r.maxTokens),
        writeMessages: Number(r.writeMessages) === 1,
        installDeps: Number(r.installDeps) === 1,
      });
    }

    // action_logs
    this._actionLogs = asArray<Row>(
      (await window.electron.dbQuery('SELECT id, agentId, time, action FROM action_logs ORDER BY time')).rows,
    ).map((r) => ({
      id: String(r.id), agentId: String(r.agentId),
      time: String(r.time), action: String(r.action),
    }));

    // next_steps
    this._nextSteps.clear();
    for (const r of asArray<Row>(
      (await window.electron.dbQuery('SELECT agentId, step FROM next_steps')).rows,
    )) {
      this._nextSteps.set(String(r.agentId), String(r.step));
    }

    // cost_usage
    this._costUsage = asArray<Row>(
      (await window.electron.dbQuery('SELECT date, cost FROM cost_usage ORDER BY date')).rows,
    ).map((r) => ({ date: String(r.date), cost: Number(r.cost) }));

    // audit_items
    this._auditItems = asArray<Row>(
      (await window.electron.dbQuery('SELECT id, type, title, description, timestamp, agentId, scope, prId, touchedFiles FROM audit_items')).rows,
    ).map((r) => ({
      id: String(r.id), type: r.type as AuditItem['type'],
      title: String(r.title), description: String(r.description),
      timestamp: String(r.timestamp), agentId: String(r.agentId),
      scope: (r.scope as string | null) ?? undefined,
      prId: (r.prId as string | null) ?? undefined,
      touchedFiles: (r.touchedFiles as number | null) ?? undefined,
    }));

    // pending_questions
    this._pendingQuestions = asArray<Row>(
      (await window.electron.dbQuery('SELECT id, agentId, threadId, messageId, question, options, timestamp FROM pending_questions')).rows,
    ).map((r) => ({
      id: String(r.id), agentId: String(r.agentId),
      threadId: (r.threadId as string | null) ?? undefined,
      messageId: (r.messageId as string | null) ?? undefined,
      question: String(r.question),
      options: r.options ? JSON.parse(String(r.options)) as string[] : undefined,
      timestamp: String(r.timestamp),
    }));

    // channel_messages
    this._channelMessages = asArray<Row>(
      (await window.electron.dbQuery('SELECT id, channelId, senderName, content, timestamp, isAI FROM channel_messages ORDER BY timestamp')).rows,
    ).map((r) => ({
      id: String(r.id), channelId: String(r.channelId),
      senderName: String(r.senderName), content: String(r.content),
      timestamp: String(r.timestamp), isAI: Number(r.isAI) === 1,
    }));

    // chat_quick_start
    this._chatQuickStart = asArray<Row>(
      (await window.electron.dbQuery('SELECT icon, label, description, category FROM chat_quick_start')).rows,
    ).map((r) => ({
      icon: String(r.icon), label: String(r.label),
      description: String(r.description), category: String(r.category),
    }));
  }

  // ── Fire-and-forget persist ───────────────────────────────────────────────

  private _persist(sql: string, args: unknown[]): void {
    if (!this._dbAvailable) return;
    void window.electron.dbExecute(sql, args).catch((err) => {
      console.warn('[DbDataSource] persist failed:', err);
    });
  }

  private _nowIso(): string { return new Date().toISOString(); }

  // ── Collections ───────────────────────────────────────────────────────────

  get workspaces(): Collection<Workspace> {
    return {
      findAll: () => [...this._workspaces],
      findById: (id) => this._workspaces.find((w) => w.id === id),
      create: (r) => {
        const item = { id: crypto.randomUUID(), ...r } as Workspace;
        this._workspaces.push(item);
        this._persist(
          'INSERT INTO workspaces (id, name, initials, avatarColor, created_at, retention_days, archived_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [item.id, item.name, item.initials, item.avatarColor ?? null, item.createdAt ?? new Date().toISOString(), item.retentionDays ?? 90, item.archivedAt ?? null],
        );
        this._notify();
        return item;
      },
      update: (id, patch) => {
        const idx = this._workspaces.findIndex((w) => w.id === id);
        if (idx === -1) return undefined;
        this._workspaces[idx] = { ...this._workspaces[idx], ...patch } as Workspace;
        const updated: Workspace = this._workspaces[idx]!;
        this._persist(
          'UPDATE workspaces SET name = ?, initials = ?, avatarColor = ?, retention_days = ?, archived_at = ? WHERE id = ?',
          [updated.name, updated.initials, updated.avatarColor ?? null, updated.retentionDays ?? 90, updated.archivedAt ?? null, id],
        );
        this._notify();
        return updated;
      },
      delete: (id) => {
        const before = this._workspaces.length;
        this._workspaces = this._workspaces.filter((w) => w.id !== id);
        if (this._workspaces.length < before) {
          this._persist('DELETE FROM workspaces WHERE id = ?', [id]);
          this._notify();
          return true;
        }
        return false;
      },
    };
  }

  get workspaceAgents() {
    type WA = { workspaceId: string; agentId: string; role: string | null; joinedAt: string };
    return {
      findAll: (): WA[] => [...this._workspaceAgents],
      create: (r: Partial<WA>): WA => {
        const item: WA = { workspaceId: r.workspaceId!, agentId: r.agentId!, role: r.role ?? null, joinedAt: r.joinedAt! };
        this._workspaceAgents.push(item);
        this._persist(
          'INSERT INTO workspace_agents (workspace_id, agent_id, role, joined_at) VALUES (?, ?, ?, ?)',
          [item.workspaceId, item.agentId, item.role, item.joinedAt],
        );
        this._notify();
        return item;
      },
      delete: (_id: string): boolean => {
        void _id;
        return false;
      },
    };
  }

  get projects(): Collection<Project> {
    return {
      findAll: () => [...this._projects],
      findById: (id) => this._projects.find((p) => p.id === id),
      create: (r) => {
        const item = r as Project;
        this._projects.push(item);
        this._persist(
          'INSERT INTO projects (id, workspaceId, data) VALUES (?, ?, ?)',
          [item.id, item.workspaceId, JSON.stringify(item)],
        );
        this._notify();
        return item;
      },
      update: (id, patch) => {
        const idx = this._projects.findIndex((p) => p.id === id);
        if (idx === -1) return undefined;
        this._projects[idx] = { ...this._projects[idx], ...patch } as Project;
        const updated: Project = this._projects[idx]!;
        this._persist(
          'UPDATE projects SET workspaceId = ?, data = ? WHERE id = ?',
          [updated.workspaceId, JSON.stringify(updated), id],
        );
        this._notify();
        return updated;
      },
      delete: (id) => {
        const before = this._projects.length;
        this._projects = this._projects.filter((p) => p.id !== id);
        if (this._projects.length < before) {
          this._persist('DELETE FROM projects WHERE id = ?', [id]);
          this._notify();
          return true;
        }
        return false;
      },
    };
  }

  get agents(): Collection<Agent> {
    return {
      findAll: () => [...this._agents],
      findById: (id) => this._agents.find((a) => a.id === id),
      create: (r) => {
        const item = r as Agent;
        this._agents.push(item);
        this._persist(
          'INSERT INTO agents (id, name, role, status, activeTask, uptime) VALUES (?, ?, ?, ?, ?, ?)',
          [item.id, item.name, item.role, item.status, item.activeTask, item.uptime],
        );
        this._notify();
        return item;
      },
      update: (id, patch) => {
        const idx = this._agents.findIndex((a) => a.id === id);
        if (idx === -1) return undefined;
        this._agents[idx] = { ...this._agents[idx], ...patch } as Agent;
        const updated: Agent = this._agents[idx]!;
        this._persist(
          'UPDATE agents SET name = ?, role = ?, status = ?, activeTask = ?, uptime = ? WHERE id = ?',
          [updated.name, updated.role, updated.status, updated.activeTask, updated.uptime, id],
        );
        this._notify();
        return updated;
      },
      delete: (id) => {
        const before = this._agents.length;
        this._agents = this._agents.filter((a) => a.id !== id);
        if (this._agents.length < before) {
          this._persist('DELETE FROM agents WHERE id = ?', [id]);
          this._notify();
          return true;
        }
        return false;
      },
    };
  }

  get tickets(): Collection<UniversalTicket> {
    return {
      findAll: () => [...this._tickets],
      findById: (id) => this._tickets.find((t) => t.id === id),
      create: (r) => {
        const item = r as UniversalTicket;
        this._tickets.push(item);
        const a = item.assignee;
        this._persist(
          'INSERT INTO universal_tickets (id, title, projectName, workspaceId, status, priority, type, assigneeName, assigneeAvatarUrl, assigneeIsAI) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [item.id, item.title, item.projectName, item.workspaceId, item.status, item.priority, item.type, a.name, a.avatarUrl ?? null, a.isAI ? 1 : 0],
        );
        this._notify();
        return item;
      },
      update: (id, patch) => {
        const idx = this._tickets.findIndex((t) => t.id === id);
        if (idx === -1) return undefined;
        this._tickets[idx] = { ...this._tickets[idx], ...patch } as UniversalTicket;
        const updated: UniversalTicket = this._tickets[idx]!;
        const a = updated.assignee;
        this._persist(
          'UPDATE universal_tickets SET title = ?, projectName = ?, workspaceId = ?, status = ?, priority = ?, type = ?, assigneeName = ?, assigneeAvatarUrl = ?, assigneeIsAI = ? WHERE id = ?',
          [updated.title, updated.projectName, updated.workspaceId, updated.status, updated.priority, updated.type, a.name, a.avatarUrl ?? null, a.isAI ? 1 : 0, id],
        );
        this._notify();
        return updated;
      },
      delete: (id) => {
        const before = this._tickets.length;
        this._tickets = this._tickets.filter((t) => t.id !== id);
        if (this._tickets.length < before) {
          this._persist('DELETE FROM universal_tickets WHERE id = ?', [id]);
          this._notify();
          return true;
        }
        return false;
      },
    };
  }

  get chat(): Collection<ChatThread> {
    return {
      findAll: () => [...this._chatThreads],
      findById: (id) => this._chatThreads.find((t) => t.id === id),
      create: (r) => {
        const item: ChatThread = {
          ...(r as ChatThread),
          messages: r.messages ?? [],
          updatedAt: r.updatedAt ?? new Date(),
        };
        this._chatThreads.push(item);
        this._persist(
          'INSERT INTO chat_threads (id, title, agentId, updatedAt, messages) VALUES (?, ?, ?, ?, ?)',
          [item.id, item.title, item.agentId ?? null, item.updatedAt.toISOString(), JSON.stringify(item.messages)],
        );
        this._notify();
        return item;
      },
      update: (id, patch) => {
        const idx = this._chatThreads.findIndex((t) => t.id === id);
        if (idx === -1) return undefined;
        this._chatThreads[idx] = { ...this._chatThreads[idx], ...patch } as ChatThread;
        const updated: ChatThread = this._chatThreads[idx]!;
        this._persist(
          'UPDATE chat_threads SET title = ?, agentId = ?, updatedAt = ?, messages = ? WHERE id = ?',
          [updated.title, updated.agentId ?? null, updated.updatedAt.toISOString(), JSON.stringify(updated.messages), id],
        );
        this._notify();
        return updated;
      },
      delete: (id) => {
        const before = this._chatThreads.length;
        this._chatThreads = this._chatThreads.filter((t) => t.id !== id);
        if (this._chatThreads.length < before) {
          this._persist('DELETE FROM chat_threads WHERE id = ?', [id]);
          this._notify();
          return true;
        }
        return false;
      },
    };
  }

  get favorites(): Collection<FavoriteRef> {
    return {
      findAll: () => [...this._favorites],
      findById: (id) => this._favorites.find((f) => f.id === id),
      create: (r) => {
        const item = r as FavoriteRef;
        this._favorites.push(item);
        this._persist(
          'INSERT INTO favorites (id, type) VALUES (?, ?)',
          [item.id, item.type],
        );
        this._notify();
        return item;
      },
      update: (id, patch) => {
        const idx = this._favorites.findIndex((f) => f.id === id);
        if (idx === -1) return undefined;
        this._favorites[idx] = { ...this._favorites[idx], ...patch } as FavoriteRef;
        const updated: FavoriteRef = this._favorites[idx]!;
        this._persist(
          'UPDATE favorites SET type = ? WHERE id = ?',
          [updated.type, id],
        );
        this._notify();
        return updated;
      },
      delete: (id) => {
        const before = this._favorites.length;
        this._favorites = this._favorites.filter((f) => f.id !== id);
        if (this._favorites.length < before) {
          this._persist('DELETE FROM favorites WHERE id = ?', [id]);
          this._notify();
          return true;
        }
        return false;
      },
    };
  }

  get themes(): Collection<Theme> {
    return {
      findAll: () => [...this._themes],
      findById: (id) => this._themes.find((t) => t.id === id),
      create: (r) => {
        const item = r as Theme;
        this._themes.push(item);
        this._persist(
          'INSERT INTO custom_themes (id, name, vars, systemVars) VALUES (?, ?, ?, ?)',
          [item.id, item.name, JSON.stringify(item.vars), item.systemVars ? JSON.stringify(item.systemVars) : null],
        );
        this._notify();
        return item;
      },
      update: (id, patch) => {
        const idx = this._themes.findIndex((t) => t.id === id);
        if (idx === -1) return undefined;
        this._themes[idx] = { ...this._themes[idx], ...patch } as Theme;
        const updated: Theme = this._themes[idx]!;
        this._persist(
          'UPDATE custom_themes SET name = ?, vars = ?, systemVars = ? WHERE id = ?',
          [updated.name, JSON.stringify(updated.vars), updated.systemVars ? JSON.stringify(updated.systemVars) : null, id],
        );
        this._notify();
        return updated;
      },
      delete: (id) => {
        const before = this._themes.length;
        this._themes = this._themes.filter((t) => t.id !== id);
        if (this._themes.length < before) {
          this._persist('DELETE FROM custom_themes WHERE id = ?', [id]);
          this._notify();
          return true;
        }
        return false;
      },
    };
  }

  get activity(): Collection<ActivityEvent> {
    return {
      findAll: () => [...this._activity],
      findById: (id) => this._activity.find((e) => e.id === id),
      create: (r) => {
        const item: ActivityEvent = {
          ...(r as ActivityEvent),
          id: r.id ?? crypto.randomUUID(),
          timestamp: r.timestamp ?? this._nowIso(),
        };
        this._activity.push(item);
        this._persist(
          'INSERT INTO home_activity_events (id, kind, workspaceId, timestamp, actor, actorId, target, message, refType, refId, refWorkspaceId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [item.id, item.kind, item.workspaceId, item.timestamp, item.actor, item.actorId ?? null, item.target ?? null, item.message, item.ref?.type ?? null, item.ref?.id ?? null, item.ref?.workspaceId ?? null],
        );
        this._notify();
        return item;
      },
      update: (id, patch) => {
        const idx = this._activity.findIndex((e) => e.id === id);
        if (idx === -1) return undefined;
        this._activity[idx] = { ...this._activity[idx], ...patch } as ActivityEvent;
        const updated: ActivityEvent = this._activity[idx]!;
        this._persist(
          'UPDATE home_activity_events SET kind = ?, workspaceId = ?, timestamp = ?, actor = ?, actorId = ?, target = ?, message = ?, refType = ?, refId = ?, refWorkspaceId = ? WHERE id = ?',
          [updated.kind, updated.workspaceId, updated.timestamp, updated.actor, updated.actorId ?? null, updated.target ?? null, updated.message, updated.ref?.type ?? null, updated.ref?.id ?? null, updated.ref?.workspaceId ?? null, id],
        );
        this._notify();
        return updated;
      },
      delete: (id) => {
        const before = this._activity.length;
        this._activity = this._activity.filter((e) => e.id !== id);
        if (this._activity.length < before) {
          this._persist('DELETE FROM home_activity_events WHERE id = ?', [id]);
          this._notify();
          return true;
        }
        return false;
      },
    };
  }

  get telemetry(): TelemetryCollection {
    return {
      findAll: () => Array.from(this._telemetry.entries()).map(([agentId, t]) => ({ id: `telemetry:${agentId}`, agentId, ...t })),
      findByAgentId: (agentId) => {
        const t = this._telemetry.get(agentId);
        return t ? { id: `telemetry:${agentId}`, agentId, ...t } : undefined;
      },
      upsert: (agentId, patch) => {
        const existing = this._telemetry.get(agentId) ?? {
          contextSaturation: 50, tokensPerSecond: 0, currentCost: 0,
          evolutionLoop: '0/100', logicKernelIntegrity: 100, sessionCost: 0, budget: 5,
        };
        const merged: Telemetry = { ...existing, ...patch };
        this._telemetry.set(agentId, merged);
        this._persist(
          'INSERT OR REPLACE INTO telemetry (agentId, contextSaturation, tokensPerSecond, currentCost, evolutionLoop, logicKernelIntegrity, sessionCost, budget) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [agentId, merged.contextSaturation, merged.tokensPerSecond, merged.currentCost, merged.evolutionLoop, merged.logicKernelIntegrity, merged.sessionCost, merged.budget],
        );
        return { id: `telemetry:${agentId}`, agentId, ...merged };
      },
    };
  }

  get permissions(): PermissionsCollection {
    return {
      findAll: () => Array.from(this._permissions.entries()).map(([agentId, p]) => ({ id: `permissions:${agentId}`, agentId, ...p })),
      findByAgentId: (agentId) => {
        const p = this._permissions.get(agentId);
        return p ? { id: `permissions:${agentId}`, agentId, ...p } : undefined;
      },
      upsert: (agentId, patch) => {
        const fallback: Permissions = {
          modelEngine: 'Opus 4.8', writeAccess: false, commitAuthority: 'REVIEW_ONLY',
          maxTokens: 8192, writeMessages: false, installDeps: false,
        };
        const existing = this._permissions.get(agentId) ?? fallback;
        const merged = { ...existing, ...patch } as Permissions;
        this._permissions.set(agentId, merged);
        this._persist(
          'INSERT OR REPLACE INTO permissions (agentId, modelEngine, writeAccess, commitAuthority, maxTokens, writeMessages, installDeps) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [agentId, merged.modelEngine, merged.writeAccess ? 1 : 0, merged.commitAuthority, merged.maxTokens, merged.writeMessages ? 1 : 0, merged.installDeps ? 1 : 0],
        );
        return { id: `permissions:${agentId}`, agentId, ...merged };
      },
    };
  }

  get actionLogs(): ActionLogCollection {
    return {
      findAll: () => [...this._actionLogs],
      findByAgentId: (agentId) => this._actionLogs.filter((e) => e.agentId === agentId),
      push: (agentId, entry) => {
        const rec = { id: crypto.randomUUID(), agentId, time: entry.time, action: entry.action };
        this._actionLogs.push(rec);
        this._persist(
          'INSERT INTO action_logs (id, agentId, time, action) VALUES (?, ?, ?, ?)',
          [rec.id, agentId, entry.time, entry.action],
        );
        return rec;
      },
    };
  }

  get nextSteps(): NextStepsCollection {
    return {
      findAll: () => Array.from(this._nextSteps.entries()).map(([agentId, step]) => ({ id: `nextStep:${agentId}`, agentId, step })),
      findByAgentId: (agentId) => {
        const step = this._nextSteps.get(agentId);
        return step !== undefined ? { id: `nextStep:${agentId}`, agentId, step } : undefined;
      },
      upsert: (agentId, step) => {
        this._nextSteps.set(agentId, step);
        this._persist(
          'INSERT OR REPLACE INTO next_steps (agentId, step) VALUES (?, ?)',
          [agentId, step],
        );
        return { id: `nextStep:${agentId}`, agentId, step };
      },
    };
  }

  get costUsage(): CostUsageCollection {
    return { findAll: () => [...this._costUsage] };
  }

  get auditItems(): AuditItemsCollection {
    return {
      findAll: () => [...this._auditItems],
      findByAgentId: (agentId) => this._auditItems.filter((a) => a.agentId === agentId),
      delete: (id) => {
        const before = this._auditItems.length;
        this._auditItems = this._auditItems.filter((a) => a.id !== id);
        if (this._auditItems.length < before) {
          this._persist('DELETE FROM audit_items WHERE id = ?', [id]);
          this._notify();
          return true;
        }
        return false;
      },
    };
  }

  get pendingQuestions(): PendingQuestionsCollection {
    return {
      findAll: () => [...this._pendingQuestions],
      findByAgentId: (agentId) => this._pendingQuestions.filter((q) => q.agentId === agentId),
      delete: (id) => {
        const before = this._pendingQuestions.length;
        this._pendingQuestions = this._pendingQuestions.filter((q) => q.id !== id);
        if (this._pendingQuestions.length < before) {
          this._persist('DELETE FROM pending_questions WHERE id = ?', [id]);
          this._notify();
          return true;
        }
        return false;
      },
    };
  }

  get channelMessages(): ChannelMessagesCollection {
    return {
      findAll: () => [...this._channelMessages],
      findByChannelId: (channelId) => this._channelMessages.filter((m) => m.channelId === channelId),
      create: (msg) => {
        const item = { ...msg } as ChannelMessage;
        this._channelMessages.push(item);
        this._persist(
          'INSERT INTO channel_messages (id, channelId, senderName, content, timestamp, isAI) VALUES (?, ?, ?, ?, ?, ?)',
          [item.id, item.channelId, item.senderName, item.content, item.timestamp, item.isAI ? 1 : 0],
        );
        this._notify();
        return item;
      },
    };
  }

  get chatQuickStart(): ChatQuickStartCollection {
    return { findAll: () => [...this._chatQuickStart] };
  }

  get currentWorkspaceId(): string {
    return this._currentWorkspaceId;
  }
}

export const dbDataSource = new DbDataSource();

export async function bootDataSource(): Promise<void> {
  await dbDataSource.load();
}