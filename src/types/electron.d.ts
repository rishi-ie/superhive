/**
 * Type definitions for window.electron — exposed by electron/preload.ts.
 * This file is ambient (no `export {}`) so the global Window augmentation is
 * always available, regardless of whether anything imports this file.
 */

type ElectronAPI = {
  platform: NodeJS.Platform;
  version: string;
  toggleMaximize: () => Promise<void>;
  onMaximizedChanged: (callback: (isMaximized: boolean) => void) => () => void;
  /** Returns the path to the app's user data directory (where .superhive/ lives). */
  getDataDir: () => Promise<string>;
  /** Reads raw content of .superhive/settings.json. Returns null if absent. */
  readSettings: () => Promise<string | null>;
  /** Writes raw content to .superhive/settings.json. */
  writeSettings: (content: string) => Promise<boolean>;
  /** Executes a SELECT against the libSQL data DB and returns rows. */
  dbQuery: (sql: string, args?: unknown[]) => Promise<{ rows: unknown[] }>;
  /** Executes a single INSERT/UPDATE/DELETE against the libSQL data DB. */
  dbExecute: (sql: string, args?: unknown[]) => Promise<{ rowsAffected: number; lastInsertRowid?: number }>;
  /** Executes a batch of statements against the libSQL data DB. */
  dbBatch: (stmts: Array<{ sql: string; args?: unknown[] }>) => Promise<void>;
  /** Executes a multi-statement SQL string (e.g. seed.sql) in one call. */
  dbExecMulti: (sql: string) => Promise<void>;
};

interface Window {
  electron: ElectronAPI;
}
