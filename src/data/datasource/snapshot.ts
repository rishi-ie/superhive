/**
 * Snapshot — the single type that defines the canonical shape of all persisted data.
 *
 * This is the source of truth for:
 *   - The MockDataSource in-memory cache structure
 *   - The future SQLite / D1 DB schema
 *   - The `TableName` literal union used by the factory
 *
 * One type. One schema. Mock JSON and DB tables are row-for-row the same shape.
 *
 * Adding a new domain (e.g. "notifications"):
 *   1. Add the type here (e.g. `notifications: Notification[]`)
 *   2. Add `'notifications'` to the TableName union
 *   3. Add seed data to mock.json
 *   4. Create src/data/notifications/{interface.ts, repository.ts, store.ts}
 *   That's it — no factory changes, no interface changes, no new methods.
 */
import type { Workspace } from '@/data/workspaces/interface';
import type { Project } from '@/data/projects/interface';
import type { UniversalTicket } from '@/data/tickets/interface';
import type { Agent, Telemetry, Permissions, AuditItem, ActionLogEntry, PendingQuestion } from '@/data/agents/interface';
import type { Theme } from '@/data/settings/interface';
import type { ActivityEvent } from '@/data/activity/interface';
import type { ChatThread } from '@/data/chat/interface';
import type { ChatThreadSeed, ChatQuickStartItem, CostUsageEntry, FavoriteSeed, ChannelMessageSeed } from '@/data/mock/types';

/**
 * The full persisted data snapshot. Maps 1:1 to mock.json keys.
 * When a real DB is wired, each top-level key becomes a table (or collection).
 *
 * Note: chatThreads is ChatThread[] (post-normalization with real Date timestamps),
 * even though the seed type in mock.json uses minutesAgo shorthands.
 * The normalization happens in MockDataSource constructor.
 */
export type Snapshot = {
  workspaces: Workspace[];
  currentWorkspaceId: string;
  projects: Project[];
  universalTickets: UniversalTicket[];
  agents: Agent[];
  telemetry: Record<string, Telemetry>;
  permissions: Record<string, Permissions>;
  actionLogs: Record<string, ActionLogEntry[]>;
  nextSteps: Record<string, string>;
  auditItems: AuditItem[];
  pendingQuestions: PendingQuestion[];
  chatThreads: ChatThread[];
  favorites: FavoriteSeed[];
  channelMessages: ChannelMessageSeed[];
  costUsage: CostUsageEntry[];
  chatQuickStart: ChatQuickStartItem[];
  customThemes: Theme[];
  homeActivityEvents: ActivityEvent[];
};

/**
 * Every named table/key in Snapshot. Used by the factory to validate
 * that every port is present.
 */
export type TableName = keyof Snapshot;

/** Row type for a given table name. */
export type TableRow<T extends TableName> = Snapshot[T] extends Array<infer U> ? U : never;

/**
 * Seed-time normalization: convert mock.json's now-relative shorthands
 * into proper ISO timestamps that match what a real DB would store.
 *
 * Currently handles:
 *   - ChatThreadSeed.messages[].minutesAgo → Message.timestamp (Date)
 *   - ChatThreadSeed.updatedAtMinutesAgo   → ChatThread.updatedAt (Date)
 *
 * Add new normalizers here as new seed-only fields are discovered.
 * After normalization, no entity contains a "minutesAgo" or similar field.
 *
 * @param seed - Raw mock.json data (before normalization)
 * @returns Normalized Snapshot with proper Date timestamps
 */
export function normalizeSeedData(
  seed: Omit<Snapshot, 'chatThreads'> & { chatThreads: ChatThreadSeed[] },
): Snapshot {
  return {
    ...seed,
    chatThreads: seed.chatThreads.map((thread) => ({
      id: thread.id,
      title: thread.title,
      agentId: thread.agentId,
      messages: thread.messages.map((msg) => ({
        ...msg,
        timestamp: new Date(Date.now() - msg.minutesAgo * 60_000),
      })),
      updatedAt: new Date(Date.now() - thread.updatedAtMinutesAgo * 60_000),
    })),
  } as Snapshot;
}
