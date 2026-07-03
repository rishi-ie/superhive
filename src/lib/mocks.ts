/**
 * Mocks — central stub-data layer replacing the deleted domain stores.
 *
 * Self-contained: declares its own prop-mirror types and exposes stub functions
 * returning empty arrays / undefined / default values. No imports from deleted
 * domain folders. Components import from here instead of `@/data/{domain}/store`.
 *
 * Vectors:
 *   - list* → returns []
 *   - get*  → returns undefined
 *   - byXxx → returns undefined
 *   - write/* functions → return void / undefined (no-op)
 *   - createXxx → returns a freshly-id'd placeholder object (still satisfies prop shape)
 */

// ─── types ─────────────────────────────────────────────────────────────────

export type IconKey = 'project' | 'agent' | 'channel' | 'workspace' | 'user' | 'system' | 'message' | string;

export type FavoriteItem = {
  id: string;
  type: 'project' | 'agent';
  label: string;
  iconKey: IconKey;
};

export type AccordionAgent = {
  id: string;
  name: string;
  status: string;
  currentTask?: string;
  initials?: string;
};

export type Workspace = {
  id: string;
  name: string;
  initials: string;
  avatarColor?: string;
  createdAt: string;
  retentionDays: number;
  archivedAt: string | null;
};

export type ProjectStatus = 'ACTIVE' | 'ARCHIVED';
export type TicketStatus = 'todo' | 'executing' | 'review' | 'merged' | 'TODO' | 'EXECUTING' | 'DONE' | string;
export type ChannelStatus = 'OPEN' | 'AWAITING_REPLY' | 'RESOLVED';
export type AgentStatus = 'STARTING' | 'EXECUTING' | 'COMPILING' | 'AWAITING_HUMAN' | 'IDLE' | 'ERROR_LOOP' | 'active' | 'idle' | 'busy' | string;
export type CommitAuthority = 'REVIEW_ONLY' | 'AUTO_MERGE' | 'DIRECT_MAIN';

export type Agent = {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  activeTask: string;
  uptime: string;
  principles: string;
  boundaries: string;
  skills: string[];
  initials?: string;
};

export type Permissions = {
  modelEngine: string;
  writeAccess: boolean;
  commitAuthority: CommitAuthority;
  maxTokens: number;
  writeMessages: boolean;
  installDeps: boolean;
};

export type Telemetry = {
  contextSaturation: number;
  tokensPerSecond: number;
  currentCost: number;
  evolutionLoop: string;
  logicKernelIntegrity: number;
  sessionCost: number;
  budget: number;
};

export type ActionLogEntry = { id: string; agentId: string; time: string; action: string };
export type AuditItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  agentId: string;
  scope?: string;
  prId?: string;
  touchedFiles?: number;
};
export type PendingQuestion = {
  id: string;
  agentId: string;
  threadId?: string;
  messageId?: string;
  question: string;
  options?: string[];
  timestamp: string;
};
export type PermissionRequest = {
  id: string;
  agentUlid: string;
  action: string;
  toolName?: string;
  args?: Record<string, unknown>;
  status: string;
  requestedAt: string;
  resolvedAt?: string;
  resolverNote?: string;
};
export type SubAgent = {
  id: string;
  parentUlid: string;
  name: string;
  kind: string;
  status: string;
  startedAt: string;
  finishedAt?: string;
  task?: string;
};
export type AgentProcess = {
  ulid: string;
  pid: number | null;
  status: string;
  lastHeartbeatAt?: string;
  startedAt: string;
  port?: number | null;
  workspaceId?: string | null;
  projectId?: string | null;
};
export type IntegrationProvider = 'github' | 'slack' | 'linear' | 'notion' | 'jira' | 'webhook';
export type Integration = {
  id: string;
  provider: IntegrationProvider | string;
  label: string;
  connected: boolean;
  apiKey?: string | null;
  baseUrl?: string | null;
  configJson?: string | null;
  updatedAt: string;
};
export type IntegrationChannel = { id: string; integrationId: string; name: string; events: string[] };

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TicketType = 'LOW' | 'MEDIUM' | 'HIGH' | 'BUG' | 'FEATURE' | 'REFACTOR' | 'INFRA' | 'bug' | 'feature' | 'refactor' | 'infra' | string;
export type UniversalTicketStatus = 'BACKLOG' | 'EXECUTING' | 'REVIEW' | 'MERGED';
export type TicketAssignee = { name: string; avatarUrl?: string; isAI: boolean };

export type UniversalTicket = {
  id: string;
  title: string;
  projectName: string;
  workspaceId: string;
  status: UniversalTicketStatus;
  priority: Priority;
  type: TicketType;
  assigneeName: string;
  assigneeAvatarUrl: string;
  assigneeIsAI: boolean;
  archivedAt: string | null;
  assignee: TicketAssignee;
};

export type Ticket = {
  id: string;
  projectId: string;
  title: string;
  status: TicketStatus;
  priority: Priority;
  type: TicketType;
  assigneeName: string;
  assigneeAvatarUrl?: string;
  assigneeIsAI: boolean;
  assigneeAgentId?: string;
  assignedAgentId?: string;
};

export type ProjectAgent = {
  id: string;
  agentId: string;
  name: string;
  initials: string;
  projectId: string;
  role: string;
  currentStatus: string;
  assignedTicketId: string | null;
  uptime: string;
};

export type CommunicationChannel = {
  id: string;
  projectId: string;
  workspaceId: string;
  topic: string;
  name: string;
  status: ChannelStatus;
  participants: string[];
  events: string[];
  unread: boolean;
  unreadCount: number;
  lastMessageAt: string;
  lastMessagePreview: string;
  updatedAt: string;
  messageCount: number;
  relatedTicketId: string | null;
};

export type ChannelMessage = {
  id: string;
  channelId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isAI: boolean;
};

export type SwarmActivityPrimaryAgent = { id: string; name: string; initials?: string };

export type SwarmActivity = {
  id: string;
  type: string;
  agentId: string;
  agentName: string;
  primaryAgent: SwarmActivityPrimaryAgent | null;
  message: string;
  action: string;
  context: string;
  timestamp: string;
  ticketId: string;
};

export type Project = {
  id: string;
  workspaceId: string;
  title: string;
  description?: string;
  successCriteria?: string;
  color?: string;
  status: ProjectStatus;
  agents: ProjectAgent[];
  tickets: Ticket[];
  channels: CommunicationChannel[];
  activity: SwarmActivity[];
};

export type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date | string;
  status?: string;
  model?: string;
  tokenCount?: number;
  durationMs?: number;
  feedback?: 'like' | 'dislike' | 'up' | 'down' | null;
  footer?: string;
};

export type ChatThread = {
  id: string;
  title: string;
  agentId?: string;
  updatedAt: Date | string;
  messages: Message[];
  threadKind?: 'agent' | 'project' | 'workspace';
  projectId?: string | null;
  workspaceId?: string | null;
};

export type ChatQuickStartItem = { icon: string; label: string; description: string; category: string };

export type ChannelParticipant = {
  channelId: string;
  agentId: string;
  participantType: string;
  canRead: boolean;
  canWrite: boolean;
  joinedAt: string;
};

export type WorkspaceAgent = { workspaceId: string; agentId: string; role?: string | null; joinedAt: string };

export type OkfBundle = { projectId: string; rootPath: string; lastSyncedAt?: string | null; entryCount: number };
export type OkfTreeNode = { name: string; path: string; isDir: boolean; children?: OkfTreeNode[] };
export type OkfFileEntry = { frontmatter: Record<string, unknown>; body: string };

export type ActivityKind =
  | 'agent_executing' | 'agent_compiling' | 'agent_idle' | 'agent_starting'
  | 'agent_awaiting_human' | 'agent_error_loop'
  | 'ticket_created' | 'ticket_updated' | 'ticket_done' | 'ticket_snoozed'
  | 'audit_auth' | 'audit_diff' | 'question_pending'
  | 'channel_message' | 'agent_handoff' | string;

export type ActivityFilter = 'all' | 'agents' | 'tickets' | 'audits' | 'chans';

export type ActivityEvent = {
  id: string;
  kind: ActivityKind | string;
  workspaceId: string;
  timestamp: string;
  actor: string;
  actorId?: string;
  target?: string;
  message: string;
  ref?: { type: string; id: string; workspaceId?: string };
};

export type UniversalProject = { id: string; workspaceId: string; title: string };
export type CostUsageEntry = { date: string; cost: number };

// ─── center tab (in-memory reducer, kept for UI shape) ────────────────────

export type CenterTabType =
  | 'home' | 'project' | 'ticket' | 'channel' | 'agent'
  | 'universal-agents' | 'universal-projects' | 'universal-channels'
  | 'workspace-agent' | 'project-agent' | 'tickets' | 'channels' | 'agents'
  | 'agents-list' | 'project-detail' | string;

export type CenterTab = {
  id: string;
  type: CenterTabType;
  workspaceId: string;
  title: string;
  pinned: boolean;
  modified?: boolean;
  subtitle?: string;
  createdAt: number;
  selectedAgentId: string | null;
  selectedProjectId: string | null;
  selectedTicketId: string | null;
  selectedChannelId: string | null;
};

export type TabState = { tabs: CenterTab[]; activeTabId: string | null };

// ─── default values ───────────────────────────────────────────────────────

export const defaultTelemetry: Telemetry = {
  contextSaturation: 0,
  tokensPerSecond: 0,
  currentCost: 0,
  evolutionLoop: '0/100',
  logicKernelIntegrity: 100,
  sessionCost: 0,
  budget: 5,
};

export const defaultPermissions: Permissions = {
  modelEngine: 'Opus 4.1',
  writeAccess: false,
  commitAuthority: 'REVIEW_ONLY',
  maxTokens: 8192,
  writeMessages: false,
  installDeps: false,
};

// ─── workspace ────────────────────────────────────────────────────────────
export function listWorkspaces(): Workspace[] { return []; }
export function getCurrentWorkspaceId(): string { return ''; }
export function getCurrentWorkspace(): Workspace | undefined { return undefined; }
export function createWorkspace(_input: { name: string; description?: string }): Workspace | null { return null; }
export function renameWorkspace(_id: string, _name: string): Workspace | undefined { return undefined; }
export function setRetention(_id: string, _days: number): Workspace | undefined { return undefined; }
export function archiveWorkspace(_id: string): Workspace | undefined { return undefined; }
export async function deleteWorkspace(_id: string): Promise<boolean> { return true; }
export function setCurrentWorkspace(_id: string): void { /* no-op */ }
export async function deleteAllWorkspaces(): Promise<boolean> { return true; }

// ─── project ──────────────────────────────────────────────────────────────
export function listProjects(_opts?: { status?: ProjectStatus }): Project[] { return []; }
export function getProject(_id: string): Project | undefined { return undefined; }
export function getProjectByWorkspace(_workspaceId: string): Project | undefined { return undefined; }
export function getProjectTitle(_workspaceId?: string): string { return ''; }
export function listTickets(_workspaceId?: string): Ticket[] { return []; }
export function listProjectAgents(_workspaceId?: string): ProjectAgent[] { return []; }
export function listSwarmActivity(_workspaceId?: string): SwarmActivity[] { return []; }
export function listChannels(_workspaceId?: string): CommunicationChannel[] { return []; }
export function getChannel(_id: string): CommunicationChannel | undefined { return undefined; }
export function listChannelMessages(_channelId: string): ChannelMessage[] { return []; }
export function createProject(_input: object): Project | null { return null; }
export function archiveProject(_id: string): Project | null { return null; }
export function unarchiveProject(_id: string): Project | null { return null; }
export function addChannelMessage(_a: string, _b: string, _c: string, _d = true): void { /* no-op */ }
export function getProjectIdByTicketId(_id: string): string | null { return null; }
export function patchProject(_id: string, _patch: object): Project | null { return null; }
export function patchChannel(_id: string, _patch: object): CommunicationChannel | undefined { return undefined; }
export function findProjectByChannelId(_id: string): Project | undefined { return undefined; }
export function removeAgentFromProject(_a: string, _b: string): ProjectAgent | undefined { return undefined; }
export function addAgentToProject(_a: string, _b: string): ProjectAgent | undefined { return undefined; }
export function createChannel(_input: object): CommunicationChannel | null { return null; }

// ─── ticket ───────────────────────────────────────────────────────────────
export function listUniversalTickets(_workspaceId?: string): UniversalTicket[] { return []; }
export function patchTicket(_id: string, _patch: object): UniversalTicket | undefined { return undefined; }
export function markTicketDone(_id: string): UniversalTicket | undefined { return undefined; }
export function snoozeTicket(_id: string): void { /* no-op */ }
export function archiveTicket(_id: string): UniversalTicket | undefined { return undefined; }
export function listActiveTickets(_workspaceId?: string): UniversalTicket[] { return []; }
export function createTicket(_input: object): UniversalTicket | null { return null; }

// ─── agent ────────────────────────────────────────────────────────────────
export function listAgents(): Agent[] { return []; }
export function getAgent(_id: string): Agent | undefined { return undefined; }
export function patchAgent(_id: string, _patch: object): Agent | undefined { return undefined; }
export function createAgent(_input: object): Agent { return undefined as unknown as Agent; }
export function getAgentKind(_agentId: string): string { return 'unstarted'; }
export function getActiveAgent(_preferredId?: string | null): Agent | null { return null; }
export function getTelemetry(_agentId: string): Telemetry { return defaultTelemetry; }
export function getPermissions(_agentId: string): Permissions { return defaultPermissions; }
export function setPermissions(_a: string, _b: Permissions): void { /* no-op */ }
export function getAuditItems(_agentId?: string): AuditItem[] { return []; }
export function approveAudit(_id: string): void { /* no-op */ }
export function denyAudit(_id: string): void { /* no-op */ }
export function getActionLog(_agentId: string): ActionLogEntry[] { return []; }
export function getNextStep(_agentId: string): string { return ''; }
export function getPendingQuestions(_agentId: string): PendingQuestion[] { return []; }
export function answerQuestion(_id: string, _a: string, _b: string): void { /* no-op */ }
export function nameToAgentId(_name: string): string | null { return null; }
export function getAgentWorkspace(_agentId: string): string | null { return null; }
export function getDefaultTelemetry(): Telemetry { return defaultTelemetry; }
export function getDefaultPermissions(): Permissions { return defaultPermissions; }

// ─── agent_process ────────────────────────────────────────────────────────
export function listAgentProcesses(): AgentProcess[] { return []; }
export function getAgentProcess(_ulid: string): AgentProcess | undefined { return undefined; }
export function listAgentProcessesByWorkspace(_ws: string): AgentProcess[] { return []; }
export function registerAgentProcess(_a: string, _b: number, _c?: string, _d?: string): AgentProcess {
  return undefined as unknown as AgentProcess;
}
export function setAgentProcessStatus(_a: string, _b: string): void { /* no-op */ }
export function recordAgentHeartbeat(_a: string): void { /* no-op */ }
export function terminateAgentProcess(_a: string): boolean { return true; }

// ─── channel_participant ──────────────────────────────────────────────────
export function listChannelParticipants(_id: string): ChannelParticipant[] { return []; }
export function addChannelParticipant(_opts: object): ChannelParticipant { return undefined as unknown as ChannelParticipant; }
export function removeChannelParticipant(_a: string, _b: string, _t?: string): boolean { return true; }
export function updateChannelParticipantPermissions(_a: string, _b: string, _patch: object, _t?: string): void { /* no-op */ }

// ─── chat ─────────────────────────────────────────────────────────────────
export function listThreads(): ChatThread[] { return []; }
export function getThread(_id: string): ChatThread | undefined { return undefined; }
export function listThreadsByScope(_opts: object): ChatThread[] { return []; }
export function getThreadByAgent(_id: string): ChatThread | undefined { return undefined; }
export function getCurrentThread(_id?: string): ChatThread | undefined { return undefined; }
export function addMessageToActiveThread(_content: string, _id?: string): void { /* no-op */ }
export function addAssistantMessage(_t: string, _c: string): Message { return undefined as unknown as Message; }
export function appendToAssistantMessage(_a: string, _b: string, _c: string): void { /* no-op */ }
export function appendFooterToMessage(_a: string, _b: string, _c: string): void { /* no-op */ }
export function updateMessage(_id: string, _patch: object): void { /* no-op */ }
export function setMessageFeedback(_id: string, _f: 'like' | 'dislike' | 'up' | 'down' | null): void { /* no-op */ }
export function createThreadForAgent(_a: string, _b: string): ChatThread { return undefined as unknown as ChatThread; }
export function getThreadByProject(_id: string): ChatThread | undefined { return undefined; }
export function getThreadByWorkspace(_id: string): ChatThread | undefined { return undefined; }
export function createThreadForProject(_a: string, _b: string): ChatThread { return undefined as unknown as ChatThread; }
export function createThreadForWorkspace(_a: string, _b: string): ChatThread { return undefined as unknown as ChatThread; }
export function listChatQuickStart(): ChatQuickStartItem[] { return []; }

// ─── cost_usage ───────────────────────────────────────────────────────────
export function listCostUsage(): CostUsageEntry[] { return []; }

// ─── favorite ────────────────────────────────────────────────────────────
export function listFavorites(): FavoriteItem[] { return []; }
export function addFavorite(_ref: object): FavoriteItem { return undefined as unknown as FavoriteItem; }
export function removeFavorite(_id: string): boolean { return true; }
export function toggleFavorite(_a: string, _b: 'project' | 'agent'): boolean { return true; }

// ─── integration ──────────────────────────────────────────────────────────
export function listIntegrations(): Integration[] { return []; }
export function getIntegration(_id: string): Integration | undefined { return undefined; }
export function connectIntegration(_a: string, _b: string, _c: string | null, _d: object = {}): void { /* no-op */ }
export function disconnectIntegration(_id: string): void { /* no-op */ }
export function listIntegrationChannels(_id: string): IntegrationChannel[] { return []; }
export function addIntegrationChannel(_a: string, _b: string, _c: string[]): IntegrationChannel { return undefined as unknown as IntegrationChannel; }
export function removeIntegrationChannel(_id: string): boolean { return true; }
export const addChannel = addIntegrationChannel;
export const removeChannel = removeIntegrationChannel;

// ─── permission_request ───────────────────────────────────────────────────
export function listPermissionRequests(): PermissionRequest[] { return []; }
export function getPermissionRequest(_id: string): PermissionRequest | undefined { return undefined; }
export function listPermissionRequestsByAgent(_ulid: string): PermissionRequest[] { return []; }
export function createPermissionRequest(_opts: object): PermissionRequest { return undefined as unknown as PermissionRequest; }
export function resolvePermissionRequest(_id: string, _s: string, _n?: string): void { /* no-op */ }

// ─── project_agent ────────────────────────────────────────────────────────
export function listProjectAgentsByProject(_id: string): ProjectAgent[] { return []; }
export function listAgentProjects(_id: string): ProjectAgent[] { return []; }
export function addAgentToProjectStore(_a: string, _b: string, _r?: string): ProjectAgent { return undefined as unknown as ProjectAgent; }
export function removeAgentFromProjectStore(_a: string, _b: string): boolean { return true; }

// ─── sub_agent ────────────────────────────────────────────────────────────
export function listSubAgents(): SubAgent[] { return []; }
export function getSubAgent(_id: string): SubAgent | undefined { return undefined; }
export function listSubAgentsByParent(_ulid: string): SubAgent[] { return []; }
export function registerSubAgent(_opts: object): SubAgent { return undefined as unknown as SubAgent; }
export function setSubAgentStatus(_id: string, _s: string): void { /* no-op */ }
export function finishSubAgent(_id: string): void { /* no-op */ }

// ─── universal_project ────────────────────────────────────────────────────
export function listUniversalProjects(): UniversalProject[] { return []; }
export function getUniversalProject(_id: string): UniversalProject | undefined { return undefined; }

// ─── workspace_agent ──────────────────────────────────────────────────────
export function listWorkspaceAgents(_id: string): WorkspaceAgent[] { return []; }
export function listAgentWorkspaces(_id: string): WorkspaceAgent[] { return []; }
export function addAgentToWorkspaceStore(_a: string, _b: string, _r?: string): WorkspaceAgent {
  return { workspaceId: _a, agentId: _b, role: _r ?? null, joinedAt: new Date().toISOString() };
}
export function removeAgentFromWorkspace(_a: string, _b: string): boolean { return true; }

// ─── channel (thin facade) ────────────────────────────────────────────────
export function updateChannel(_id: string, _patch: object): CommunicationChannel | undefined { return undefined; }
export function getProjectForChannel(_id: string): Project | undefined { return undefined; }

// ─── okf (SQLite metadata) ────────────────────────────────────────────────
export function getBundle(_id: string): OkfBundle | undefined { return undefined; }
export function listBundles(): OkfBundle[] { return []; }
export function ensureBundle(_id: string): OkfBundle { return { projectId: _id, rootPath: _id, lastSyncedAt: null, entryCount: 0 }; }
export function setLastSynced(_a: string, _b: string): void { /* no-op */ }
export function incrementEntryCount(_id: string): void { /* no-op */ }

// ─── okf (filesystem, IPC) ────────────────────────────────────────────────
export async function getOkfDataDir(): Promise<string> { return ''; }
export async function bundleExists(_id: string): Promise<boolean> { return false; }
export async function readBundle(_id: string): Promise<Record<string, OkfFileEntry>> { return {}; }
export async function readConcept(_a: string, _b: string): Promise<OkfFileEntry | null> { return null; }
export async function writeConcept(_a: string, _b: string, _c: object, _d: string): Promise<void> { /* no-op */ }
export async function listBundleTree(_id: string): Promise<OkfTreeNode | null> { return null; }
export async function searchBundle(_a: string, _b: string): Promise<Array<{ path: string; preview: string }>> { return []; }
export async function createBundle(_id: string): Promise<void> { /* no-op */ }
export async function deleteBundle(_id: string): Promise<void> { /* no-op */ }
export async function deleteAllBundles(): Promise<void> { /* no-op */ }

// ─── activity (merged feed) ───────────────────────────────────────────────
export function listActivity(_opts?: object): ActivityEvent[] { return []; }

// ─── center tab reducer (in-memory only) ──────────────────────────────────

function matchesKey(tab: CenterTab, type: CenterTabType, workspaceId: string, entityId?: string | null): boolean {
  if (tab.type !== type) return false;
  if (tab.type === 'project') return tab.selectedProjectId === entityId;
  if (tab.type === 'channel') return tab.selectedChannelId === entityId;
  if (tab.type === 'agent') return tab.selectedAgentId === entityId;
  if (tab.type === 'universal-agents' || tab.type === 'universal-projects' || tab.type === 'universal-channels') return true;
  return tab.workspaceId === workspaceId;
}

export function makeInitialTabState(workspaceId: string): TabState {
  const id = crypto.randomUUID();
  return {
    tabs: [
      {
        id, type: 'home', workspaceId, title: 'Home', pinned: true,
        selectedAgentId: null, selectedProjectId: null,
        selectedTicketId: null, selectedChannelId: null,
        createdAt: Date.now(),
      },
    ],
    activeTabId: id,
  };
}

export function openOrFocusTab(state: TabState, partial: Omit<CenterTab, 'id' | 'createdAt'>): TabState {
  const entityId =
    partial.selectedAgentId ?? partial.selectedProjectId ??
    partial.selectedTicketId ?? partial.selectedChannelId ?? null;
  const existing = state.tabs.find((t) => matchesKey(t, partial.type, partial.workspaceId, entityId));
  if (existing) return { ...state, activeTabId: existing.id };
  const newTab: CenterTab = {
    ...partial,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    selectedAgentId: partial.selectedAgentId ?? null,
    selectedProjectId: partial.selectedProjectId ?? null,
    selectedTicketId: partial.selectedTicketId ?? null,
    selectedChannelId: partial.selectedChannelId ?? null,
  };
  return { tabs: [...state.tabs, newTab], activeTabId: newTab.id };
}

export function closeTab(state: TabState, tabId: string): TabState {
  const idx = state.tabs.findIndex((t) => t.id === tabId);
  if (idx === -1) return state;
  const tab = state.tabs[idx]!;
  if (tab.pinned) return state;
  const newTabs = state.tabs.filter((t) => t.id !== tabId);
  if (newTabs.length === 0) return { tabs: [], activeTabId: null };
  let newActiveTabId = state.activeTabId;
  if (state.activeTabId === tabId) newActiveTabId = newTabs[idx]?.id ?? newTabs[idx - 1]?.id ?? null;
  return { tabs: newTabs, activeTabId: newActiveTabId };
}

export function selectTab(state: TabState, tabId: string): TabState { return { ...state, activeTabId: tabId }; }
export function setSelection(state: TabState, _tabId: string, _sel: object): TabState { return state; }
export function pinTab(state: TabState, tabId: string, pinned: boolean): TabState {
  return { ...state, tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, pinned } : t)) };
}
export function getActiveTab(state: TabState): CenterTab | null {
  return state.tabs.find((t) => t.id === state.activeTabId) ?? null;
}
export function findTab(state: TabState, type: CenterTabType, workspaceId?: string, entityId?: string | null): CenterTab | null {
  return state.tabs.find((t) => matchesKey(t, type, workspaceId ?? t.workspaceId, entityId)) ?? null;
}

// ─── namespace bundle ────────────────────────────────────────────────────

export const mock = {
  // workspace
  listWorkspaces, getCurrentWorkspaceId, getCurrentWorkspace,
  createWorkspace, renameWorkspace, setRetention, archiveWorkspace,
  deleteWorkspace, setCurrentWorkspace, deleteAllWorkspaces,
  // project
  listProjects, getProject, getProjectByWorkspace, getProjectTitle,
  listTickets, listProjectAgents, listSwarmActivity, listChannels, getChannel,
  listChannelMessages, createProject, archiveProject, unarchiveProject,
  addChannelMessage, getProjectIdByTicketId, patchProject, patchChannel,
  findProjectByChannelId, removeAgentFromProject, addAgentToProject, createChannel,
  // ticket
  listUniversalTickets, patchTicket, markTicketDone, snoozeTicket,
  archiveTicket, listActiveTickets, createTicket,
  // agent
  listAgents, getAgent, patchAgent, createAgent, getAgentKind, getActiveAgent,
  getTelemetry, getPermissions, setPermissions, getAuditItems, approveAudit, denyAudit,
  getActionLog, getNextStep, getPendingQuestions, answerQuestion,
  nameToAgentId, getAgentWorkspace, getDefaultTelemetry, getDefaultPermissions,
  // agent_process
  listAgentProcesses, getAgentProcess, listAgentProcessesByWorkspace,
  registerAgentProcess, setAgentProcessStatus, recordAgentHeartbeat, terminateAgentProcess,
  // channel_participant
  listChannelParticipants, addChannelParticipant, removeChannelParticipant, updateChannelParticipantPermissions,
  // chat
  listThreads, getThread, listThreadsByScope, getThreadByAgent, getCurrentThread,
  addMessageToActiveThread, addAssistantMessage, appendToAssistantMessage, appendFooterToMessage,
  updateMessage, setMessageFeedback, createThreadForAgent, getThreadByProject, getThreadByWorkspace,
  createThreadForProject, createThreadForWorkspace, listChatQuickStart,
  // cost_usage
  listCostUsage,
  // favorite
  listFavorites, addFavorite, removeFavorite, toggleFavorite,
  // integration
  listIntegrations, getIntegration, connectIntegration, disconnectIntegration,
  addChannel, removeChannel,
  // permission_request
  listPermissionRequests, getPermissionRequest, listPermissionRequestsByAgent,
  createPermissionRequest, resolvePermissionRequest,
  // project_agent
  listProjectAgentsByProject, listAgentProjects,
  // sub_agent
  listSubAgents, getSubAgent, listSubAgentsByParent,
  registerSubAgent, setSubAgentStatus, finishSubAgent,
  // universal_project
  listUniversalProjects, getUniversalProject,
  // workspace_agent
  listWorkspaceAgents, listAgentWorkspaces,
  addAgentToWorkspace: addAgentToWorkspaceStore,
  removeAgentFromWorkspace,
  // channel
  updateChannel, getProjectForChannel,
  // okf
  getBundle, listBundles, ensureBundle, setLastSynced, incrementEntryCount,
  getOkfDataDir, bundleExists, readBundle, readConcept, writeConcept,
  listBundleTree, searchBundle, createBundle, deleteBundle, deleteAllBundles,
  // activity
  listActivity,
  // tab
  makeInitialTabState, openOrFocusTab, closeTab, selectTab, setSelection, pinTab, getActiveTab, findTab,
};
