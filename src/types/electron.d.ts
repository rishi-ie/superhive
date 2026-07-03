/**
 * Type definitions for window.electron — exposed by electron/preload.ts.
 * This file is ambient (no `export {}`) so the global Window augmentation is
 * always available, regardless of whether anything imports this file.
 */

type ElectronAPI = {
  /** Executes a SELECT against the libSQL data DB and returns rows. */
  dbQuery: (sql: string, args?: unknown[]) => Promise<{ rows: unknown[] }>;
  /** Executes a single INSERT/UPDATE/DELETE against the libSQL data DB. */
  dbExecute: (sql: string, args?: unknown[]) => Promise<{ rowsAffected: number; lastInsertRowid?: number }>;
  /** Executes a batch of statements against the libSQL data DB. */
  dbBatch: (stmts: Array<{ sql: string; args?: unknown[] }>) => Promise<void>;
};

interface Window {
  electron: ElectronAPI;
}
