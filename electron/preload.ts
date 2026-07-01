import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  platform: NodeJS.Platform;
  version: string;
  toggleMaximize: () => void;
  onMaximizedChanged: (callback: (isMaximized: boolean) => void) => () => void;
  /** Returns the path to the app's user data directory (where .superhive/ lives). */
  getDataDir: () => Promise<string>;
  /** Reads the raw content of settings.json from .superhive/settings.json. */
  readSettings: () => Promise<string | null>;
  /** Writes raw content to .superhive/settings.json. */
  writeSettings: (content: string) => Promise<boolean>;
  /** Executes a SELECT against the libSQL data DB and returns rows. */
  dbQuery: (sql: string, args?: unknown[]) => Promise<{ rows: unknown[] }>;
  /** Executes a single INSERT/UPDATE/DELETE against the libSQL data DB. */
  dbExecute: (sql: string, args?: unknown[]) => Promise<{ rowsAffected: number; lastInsertRowid?: number }>;
  /** Executes a batch of statements inside one transaction-like call. */
  dbBatch: (stmts: Array<{ sql: string; args?: unknown[] }>) => Promise<void>;
  /** Executes a multi-statement SQL string (e.g. seed.sql) in one call. */
  dbExecMulti: (sql: string) => Promise<void>;
}

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  version: process.versions.electron,
  toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
  onMaximizedChanged: (callback: (isMaximized: boolean) => void) => {
    const listener = (_: unknown, isMaximized: boolean) => callback(isMaximized);
    ipcRenderer.on('window:maximized-changed', listener);
    return () => ipcRenderer.removeListener('window:maximized-changed', listener);
  },
  getDataDir: () => ipcRenderer.invoke('app:get-data-dir'),
  readSettings: () => ipcRenderer.invoke('settings:read'),
  writeSettings: (content: string) => ipcRenderer.invoke('settings:write', content),
  dbQuery: (sql: string, args?: unknown[]) => ipcRenderer.invoke('db:query', sql, args),
  dbExecute: (sql: string, args?: unknown[]) => ipcRenderer.invoke('db:execute', sql, args),
  dbBatch: (stmts: Array<{ sql: string; args?: unknown[] }>) => ipcRenderer.invoke('db:batch', stmts),
  dbExecMulti: (sql: string) => ipcRenderer.invoke('db:exec-multi', sql),
} satisfies ElectronAPI);

console.log('Preload script loaded');
