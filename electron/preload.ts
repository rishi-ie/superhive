const { contextBridge, ipcRenderer } = require('electron');

/** @deprecated Types only — ElectronAPI is used by renderer for window.electron typing. */
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
  /** Subscribe to WS events from main. Returns an unsubscribe function. */
  onWsEvent: (callback: (event: Record<string, unknown>) => void) => () => void;
  agents: {
    terminateAll: () => Promise<void>;
    terminate: (ulid: string) => Promise<void>;
  },
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
  onWsEvent: (callback: (event: Record<string, unknown>) => void) => {
    const listener = (_: unknown, payload: unknown) => callback(payload as Record<string, unknown>);
    ipcRenderer.on('ws:event', listener);
    return () => ipcRenderer.removeListener('ws:event', listener);
  },
  agents: {
    terminateAll: () => ipcRenderer.invoke('agents:terminate-all'),
    terminate: (ulid: string) => ipcRenderer.invoke('agents:terminate', ulid),
  },
});

console.log('Preload script loaded');
