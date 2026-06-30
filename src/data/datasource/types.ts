/**
 * DataSource abstraction — the single seam between domain stores and data backends.
 *
 * Two implementations exist:
 *   MockDataSource — in-memory, seeded from mock.json (now)
 *   DbDataSource   — IPC → SQLite in Electron main (future; ships as stub)
 *
 * Both satisfy this interface. The factory in index.ts selects which to use
 * based on VITE_DATA_SOURCE env var (default: mock).
 */

/**
 * Marker for all entity types that can live in a Collection.
 * Requires an `id` field that serves as the primary key.
 */
export type Entity = { id: string };

/**
 * A Collection is the unit of data access — one per table/domain.
 * All mutations return the modified/new record; reads return cloned data
 * so the internal cache is never exposed directly.
 */
export interface Collection<T extends Entity> {
  findAll(): T[];
  findById(id: string): T | undefined;
  create(record: Partial<T>): T;
  update(id: string, patch: Partial<T>): T | undefined;
  delete(id: string): boolean;
}

/**
 * DataSource is the root export. Each named collection maps to one domain
 * of data. Swap the implementation = swap the backend, zero store changes.
 */
export interface DataSource {
  /**
   * Boot the data source. Call once before any collection access.
   * MockDataSource: resolves immediately (data is already in memory).
   * DbDataSource: opens the SQLite connection (future work).
   */
  load(): Promise<void>;

  get workspaces(): Collection<import('../workspaces/interface').Workspace>;
  get projects(): Collection<import('../projects/interface').Project>;
  get agents(): Collection<import('../agents/interface').Agent>;
  get tickets(): Collection<import('../tickets/interface').UniversalTicket>;
  get chat(): Collection<import('../chat/interface').ChatThread>;
  get favorites(): Collection<import('../favorites/interface').FavoriteRef>;
  get themes(): Collection<import('../settings/interface').Theme>;
  get activity(): Collection<import('../activity/interface').ActivityEvent>;

  get telemetry(): TelemetryCollection;
  get permissions(): PermissionsCollection;
  get actionLogs(): ActionLogCollection;
  get nextSteps(): NextStepsCollection;
  get costUsage(): CostUsageCollection;
  get auditItems(): AuditItemsCollection;
  get pendingQuestions(): PendingQuestionsCollection;
  get channelMessages(): ChannelMessagesCollection;
  get chatQuickStart(): ChatQuickStartCollection;

  get currentWorkspaceId(): string;
}

export interface TelemetryRecord extends Entity {
  agentId: string;
  contextSaturation: number;
  tokensPerSecond: number;
  currentCost: number;
  evolutionLoop: string;
  logicKernelIntegrity: number;
  sessionCost: number;
  budget: number;
}

export interface TelemetryCollection {
  findAll(): TelemetryRecord[];
  findByAgentId(agentId: string): TelemetryRecord | undefined;
  upsert(agentId: string, patch: Partial<TelemetryRecord>): TelemetryRecord;
}

export interface PermissionsRecord extends Entity {
  agentId: string;
  modelEngine: string;
  writeAccess: boolean;
  commitAuthority: string;
  maxTokens: number;
  writeMessages: boolean;
  installDeps: boolean;
}

export interface PermissionsCollection {
  findAll(): PermissionsRecord[];
  findByAgentId(agentId: string): PermissionsRecord | undefined;
  upsert(agentId: string, patch: Partial<PermissionsRecord>): PermissionsRecord;
}

export interface ActionLogRecord extends Entity {
  agentId: string;
  time: string;
  action: string;
}

export interface ActionLogCollection {
  findAll(): ActionLogRecord[];
  findByAgentId(agentId: string): ActionLogRecord[];
  push(agentId: string, entry: Omit<ActionLogRecord, 'id' | 'agentId'>): ActionLogRecord;
}

export interface NextStepsRecord extends Entity {
  agentId: string;
  step: string;
}

export interface NextStepsCollection {
  findAll(): NextStepsRecord[];
  findByAgentId(agentId: string): NextStepsRecord | undefined;
  upsert(agentId: string, step: string): NextStepsRecord;
}

/** CostUsageEntry is keyed by date, not id — has its own simple interface. */
export interface CostUsageCollection {
  findAll(): import('../cost-usage/interface').CostUsageEntry[];
}

export interface AuditItemsCollection {
  findAll(): import('../agents/interface').AuditItem[];
  findByAgentId(agentId: string): import('../agents/interface').AuditItem[];
  delete(id: string): boolean;
}

export interface PendingQuestionsCollection {
  findAll(): import('../agents/interface').PendingQuestion[];
  findByAgentId(agentId: string): import('../agents/interface').PendingQuestion[];
  delete(id: string): boolean;
}

export interface ChannelMessagesCollection {
  findAll(): import('../projects/interface').ChannelMessage[];
  findByChannelId(channelId: string): import('../projects/interface').ChannelMessage[];
  create(msg: import('../projects/interface').ChannelMessage): import('../projects/interface').ChannelMessage;
}

export interface ChatQuickStartCollection {
  findAll(): import('../mock/types').ChatQuickStartItem[];
}
