/**
 * schema.ts — libSQL DDL for all tables backing the DataSource collections.
 *
 * Schema versioning: bump SCHEMA_VERSION whenever columns or tables change
 * incompatibly. The boot path in db-source.ts drops all tables on version
 * mismatch and re-applies SCHEMA from scratch, then re-seeds.
 *
 * Conventions:
 *   - `id` is the synthetic primary key, TEXT.
 *   - Foreign-key-like columns (agentId, channelId) are indexed for fast lookups.
 *   - Complex nested payloads (Project.tickets/agents/channels/activity, ChatThread.messages,
 *     Theme.vars/systemVars, PendingQuestion.options, ActivityEvent.ref) live in JSON TEXT
 *     columns — keeps the schema flat, no JOIN overhead.
 *   - `meta` is a key/value table for app-level singletons (seeded flag, currentWorkspaceId).
 *   - `schema_meta` tracks the schema version only — independent of user data.
 */
export const SCHEMA_VERSION = 3;

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS schema_meta (
  k TEXT PRIMARY KEY,
  v TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  avatarColor TEXT,
  created_at TEXT NOT NULL,
  retention_days INTEGER NOT NULL DEFAULT 90,
  archived_at TEXT
);

CREATE TABLE IF NOT EXISTS workspace_agents (
  workspace_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  role TEXT,
  joined_at TEXT NOT NULL,
  PRIMARY KEY (workspace_id, agent_id)
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  workspaceId TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_projects_workspace ON projects(workspaceId);

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL,
  activeTask TEXT NOT NULL DEFAULT '',
  uptime TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS universal_tickets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  projectName TEXT NOT NULL,
  workspaceId TEXT NOT NULL,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  type TEXT NOT NULL,
  assigneeName TEXT NOT NULL,
  assigneeAvatarUrl TEXT,
  assigneeIsAI INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_universal_tickets_workspace ON universal_tickets(workspaceId);

CREATE TABLE IF NOT EXISTS chat_threads (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  agentId TEXT,
  updatedAt TEXT NOT NULL,
  messages TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS favorites (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS custom_themes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  vars TEXT NOT NULL,
  systemVars TEXT
);

CREATE TABLE IF NOT EXISTS home_activity_events (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  workspaceId TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  actor TEXT NOT NULL,
  actorId TEXT,
  target TEXT,
  message TEXT NOT NULL,
  refType TEXT,
  refId TEXT,
  refWorkspaceId TEXT
);
CREATE INDEX IF NOT EXISTS idx_activity_workspace ON home_activity_events(workspaceId);
CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON home_activity_events(timestamp);

CREATE TABLE IF NOT EXISTS telemetry (
  agentId TEXT PRIMARY KEY,
  contextSaturation REAL NOT NULL DEFAULT 0,
  tokensPerSecond REAL NOT NULL DEFAULT 0,
  currentCost REAL NOT NULL DEFAULT 0,
  evolutionLoop TEXT NOT NULL DEFAULT '0/100',
  logicKernelIntegrity REAL NOT NULL DEFAULT 100,
  sessionCost REAL NOT NULL DEFAULT 0,
  budget REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS permissions (
  agentId TEXT PRIMARY KEY,
  modelEngine TEXT NOT NULL DEFAULT 'Opus 4.8',
  writeAccess INTEGER NOT NULL DEFAULT 0,
  commitAuthority TEXT NOT NULL DEFAULT 'REVIEW_ONLY',
  maxTokens INTEGER NOT NULL DEFAULT 8192,
  writeMessages INTEGER NOT NULL DEFAULT 0,
  installDeps INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS action_logs (
  id TEXT PRIMARY KEY,
  agentId TEXT NOT NULL,
  time TEXT NOT NULL,
  action TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_action_logs_agent ON action_logs(agentId);

CREATE TABLE IF NOT EXISTS next_steps (
  agentId TEXT PRIMARY KEY,
  step TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cost_usage (
  date TEXT PRIMARY KEY,
  cost REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS audit_items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  agentId TEXT NOT NULL,
  scope TEXT,
  prId TEXT,
  touchedFiles INTEGER
);
CREATE INDEX IF NOT EXISTS idx_audit_items_agent ON audit_items(agentId);

CREATE TABLE IF NOT EXISTS pending_questions (
  id TEXT PRIMARY KEY,
  agentId TEXT NOT NULL,
  threadId TEXT,
  messageId TEXT,
  question TEXT NOT NULL,
  options TEXT,
  timestamp TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pending_questions_agent ON pending_questions(agentId);

CREATE TABLE IF NOT EXISTS channel_messages (
  id TEXT PRIMARY KEY,
  channelId TEXT NOT NULL,
  senderName TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  isAI INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_channel_messages_channel ON channel_messages(channelId);

CREATE TABLE IF NOT EXISTS chat_quick_start (
  id TEXT PRIMARY KEY,
  icon TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL
);
`;