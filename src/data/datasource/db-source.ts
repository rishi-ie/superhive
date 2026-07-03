/**
 * schema-boot — runs libSQL DDL on first launch.
 *
 * Schema lives in <userData>/.superhive/data.db (local file) or at LIBSQL_URL.
 * Renderer never reads from the DB; this exists only to keep the schema in sync.
 */
import { SCHEMA, SCHEMA_VERSION } from './schema';

type Row = Record<string, unknown>;

function asArray<T>(rows: unknown): T[] {
  return Array.isArray(rows) ? (rows as T[]) : [];
}

export async function bootDataSource(): Promise<void> {
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
    console.warn('[schema-boot] load failed:', err);
  }
}
