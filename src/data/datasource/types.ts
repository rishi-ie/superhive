/**
 * DataSource abstraction — the single seam between domain stores and data backends.
 *
 * The implementation is DbDataSource (SQLite via Electron main). Both satisfy
 * this interface — swapping the implementation swaps the backend, zero store changes.
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
   * DbDataSource: runs schema DDL then seeds from seed.sql.
   */
  load(): Promise<void>;

  get workspaces(): Collection<import('../workspace/interface').Workspace>;
  get workspaceAgents(): WorkspaceAgentsCollection;
  get projectAgents(): ProjectAgentsCollection;
  get okfBundles(): OkfBundlesCollection;
  get agentProcesses(): AgentProcessesCollection;
  get integrations(): IntegrationsCollection;
  get integrationChannels(): IntegrationChannelsCollection;
  get permissionRequests(): PermissionRequestsCollection;
  get subAgents(): SubAgentsCollection;
  get channelParticipants(): ChannelParticipantsCollection;
  get projects(): Collection<import('../project/interface').Project>;
  get agents(): Collection<import('../agent/interface').Agent>;
  get tickets(): Collection<import('../ticket/interface').UniversalTicket>;
  get favorites(): Collection<import('../favorite/interface').FavoriteRef>;
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
  findAll(): import('../cost_usage/interface').CostUsageEntry[];
}

export interface AuditItemsCollection {
  findAll(): import('../agent/interface').AuditItem[];
  findByAgentId(agentId: string): import('../agent/interface').AuditItem[];
  delete(id: string): boolean;
}

export interface PendingQuestionsCollection {
  findAll(): import('../agent/interface').PendingQuestion[];
  findByAgentId(agentId: string): import('../agent/interface').PendingQuestion[];
  delete(id: string): boolean;
}

export interface ChannelMessagesCollection {
  findAll(): import('../project/interface').ChannelMessage[];
  findByChannelId(channelId: string): import('../project/interface').ChannelMessage[];
  create(msg: import('../project/interface').ChannelMessage): import('../project/interface').ChannelMessage;
}

export interface WorkspaceAgentsCollection {
  findAll(): { workspaceId: string; agentId: string; role: string | null; joinedAt: string }[];
  create(record: { workspaceId: string; agentId: string; role: string | null; joinedAt: string }): { workspaceId: string; agentId: string; role: string | null; joinedAt: string };
  delete(workspaceId: string, agentId: string): boolean;
}

export interface ProjectAgentsCollection {
  findAll(): { projectId: string; agentId: string; role: string | null; currentStatus: string; assignedTicketId: string | null; joinedAt: string; contextSnapshotPath: string | null }[];
  create(record: { projectId: string; agentId: string; role?: string; currentStatus?: string; assignedTicketId?: string; joinedAt?: string; contextSnapshotPath?: string }): { projectId: string; agentId: string; role: string | null; currentStatus: string; assignedTicketId: string | null; joinedAt: string; contextSnapshotPath: string | null };
  delete(projectId: string, agentId: string): boolean;
}

export interface OkfBundleRecord {
  projectId: string;
  rootPath: string;
  lastSyncedAt: string | null;
  entryCount: number;
}

export interface OkfBundlesCollection {
  findAll(): OkfBundleRecord[];
  findByProjectId(projectId: string): OkfBundleRecord | undefined;
  upsert(projectId: string, rootPath: string): OkfBundleRecord;
  setLastSynced(projectId: string, at: string): void;
  incrementEntryCount(projectId: string): void;
}

export type AgentProcessRecord = {
  ulid: string;
  pid: number | null;
  status: string;
  lastHeartbeatAt: string | null;
  startedAt: string;
  port: number | null;
  workspaceId: string | null;
  projectId: string | null;
};

export interface AgentProcessesCollection {
  findAll(): AgentProcessRecord[];
  findByUlid(ulid: string): AgentProcessRecord | undefined;
  upsert(record: Partial<AgentProcessRecord> & { ulid: string }): AgentProcessRecord;
  setStatus(ulid: string, status: string): void;
  recordHeartbeat(ulid: string): void;
  remove(ulid: string): boolean;
}

export interface IntegrationRecord extends Entity {
  id: string;
  provider: string;
  label: string;
  connected: boolean;
  apiKey: string | null;
  baseUrl: string | null;
  configJson: string | null;
  updatedAt: string;
}

export interface IntegrationsCollection {
  findAll(): IntegrationRecord[];
  findById(id: string): IntegrationRecord | undefined;
  upsert(id: string, patch: Partial<Omit<IntegrationRecord, 'id'>>): IntegrationRecord;
}

export interface IntegrationChannelRecord extends Entity {
  id: string;
  integrationId: string;
  name: string;
  eventsJson: string;
}

export interface IntegrationChannelsCollection {
  findAll(): IntegrationChannelRecord[];
  findByIntegrationId(integrationId: string): IntegrationChannelRecord[];
  create(record: Omit<IntegrationChannelRecord, 'id'>): IntegrationChannelRecord;
  remove(id: string): boolean;
}

export type PermissionRequestRecord = {
  id: string;
  agentUlid: string;
  action: string;
  toolName: string | null;
  argsJson: string | null;
  status: string;
  requestedAt: string;
  resolvedAt: string | null;
  resolverNote: string | null;
};

export interface PermissionRequestsCollection {
  findAll(): PermissionRequestRecord[];
  findById(id: string): PermissionRequestRecord | undefined;
  create(record: Omit<PermissionRequestRecord, 'id'>): PermissionRequestRecord;
  resolve(id: string, status: string, note?: string): void;
  listByAgent(agentUlid: string): PermissionRequestRecord[];
}

export type SubAgentRecord = {
  id: string;
  parentUlid: string;
  name: string;
  kind: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  task: string | null;
};

export interface SubAgentsCollection {
  findAll(): SubAgentRecord[];
  findById(id: string): SubAgentRecord | undefined;
  create(record: Omit<SubAgentRecord, 'id'>): SubAgentRecord;
  setStatus(id: string, status: string): void;
  finish(id: string): void;
  listByParent(parentUlid: string): SubAgentRecord[];
}

export type ChannelParticipantRecord = {
  channelId: string;
  agentId: string;
  participantType: string;
  canRead: boolean;
  canWrite: boolean;
  joinedAt: string;
};

export interface ChannelParticipantsCollection {
  findAll(): ChannelParticipantRecord[];
  findByChannelId(channelId: string): ChannelParticipantRecord[];
  create(record: Omit<ChannelParticipantRecord, 'channelId' | 'agentId' | 'participantType'> & { channelId: string; agentId: string; participantType: string }): ChannelParticipantRecord;
  remove(channelId: string, agentId: string, participantType: string): boolean;
  updatePermissions(channelId: string, agentId: string, participantType: string, patch: { canRead?: boolean; canWrite?: boolean }): void;
}
