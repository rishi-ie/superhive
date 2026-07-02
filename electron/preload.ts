const { contextBridge, ipcRenderer } = require('electron');

type Unsubscribe = () => void;

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
  /** Executes a multi-statement SQL string (e.g. seed.sql) in one call. */
  dbExecMulti: (sql: string) => Promise<void>;
  /** Subscribe to WS events from main. Returns an unsubscribe function. */
  onWsEvent: (callback: (event: Record<string, unknown>) => void) => () => void;
  okf: {
    getDataDir: () => Promise<string>;
    bundleExists: (projectId: string) => Promise<boolean>;
    createBundle: (projectId: string) => Promise<void>;
    readBundle: (projectId: string) => Promise<Record<string, { frontmatter: Record<string, unknown>; body: string }>>;
    writeConcept: (projectId: string, path: string, frontmatter: Record<string, unknown>, body: string) => Promise<void>;
    readConcept: (projectId: string, path: string) => Promise<{ frontmatter: Record<string, unknown>; body: string } | null>;
    listTree: (projectId: string) => Promise<OkfTreeNode | null>;
    search: (projectId: string, query: string) => Promise<Array<{ path: string; preview: string }>>;
    deleteBundle: (projectId: string) => Promise<void>;
    deleteAllBundles: () => Promise<void>;
  };
  agents: {
    terminateAll: () => Promise<void>;
    terminate: (ulid: string) => Promise<void>;
  },
  fs: {
    pathExists: (p: string) => Promise<boolean>;
    ensureDir: (p: string) => Promise<boolean>;
  },
  app: {
    agentsDir: () => Promise<string>;
  },
  pty: {
    spawn: (id: string, agentPath: string, cols?: number, rows?: number) => Promise<{ ok: true } | { ok: false; error: string }>;
    write: (id: string, data: string) => Promise<boolean>;
    resize: (id: string, cols: number, rows: number) => Promise<boolean>;
    kill: (id: string) => Promise<boolean>;
    list: () => Promise<string[]>;
    onData: (id: string, callback: (data: string) => void) => Unsubscribe;
    onExit: (id: string, callback: (payload: { exitCode: number }) => void) => Unsubscribe;
  },
}

type OkfTreeNode = {
  name: string;
  path: string;
  isDir: boolean;
  children?: OkfTreeNode[];
};

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
  onWsEvent: (callback: (event: Record<string, unknown>) => void) => {
    const listener = (_: unknown, payload: unknown) => callback(payload as Record<string, unknown>);
    ipcRenderer.on('ws:event', listener);
    return () => ipcRenderer.removeListener('ws:event', listener);
  },
  okf: {
    getDataDir: () => ipcRenderer.invoke('okf:get-data-dir'),
    bundleExists: (projectId: string) => ipcRenderer.invoke('okf:bundle-exists', projectId),
    createBundle: (projectId: string) => ipcRenderer.invoke('okf:create-bundle', projectId),
    readBundle: (projectId: string) => ipcRenderer.invoke('okf:read-bundle', projectId),
    writeConcept: (projectId: string, path: string, frontmatter: Record<string, unknown>, body: string) =>
      ipcRenderer.invoke('okf:write-concept', projectId, path, frontmatter, body),
    readConcept: (projectId: string, path: string) => ipcRenderer.invoke('okf:read-concept', projectId, path),
    listTree: (projectId: string) => ipcRenderer.invoke('okf:list-tree', projectId),
    search: (projectId: string, query: string) => ipcRenderer.invoke('okf:search', projectId, query),
    deleteBundle: (projectId: string) => ipcRenderer.invoke('okf:delete-bundle', projectId),
    deleteAllBundles: () => ipcRenderer.invoke('okf:delete-all-bundles'),
  },
  agents: {
    terminateAll: () => ipcRenderer.invoke('agents:terminate-all'),
    terminate: (ulid: string) => ipcRenderer.invoke('agents:terminate', ulid),
  },
  fs: {
    pathExists: (p: string) => ipcRenderer.invoke('fs:path-exists', p),
    ensureDir: (p: string) => ipcRenderer.invoke('fs:ensure-dir', p),
  },
  app: {
    agentsDir: () => ipcRenderer.invoke('app:agents-dir'),
  },
  pty: {
    spawn: (id: string, agentPath: string, cols = 80, rows = 24) =>
      ipcRenderer.invoke('pty:spawn', id, agentPath, cols, rows),
    write: (id: string, data: string) => ipcRenderer.invoke('pty:write', id, data),
    resize: (id: string, cols: number, rows: number) => ipcRenderer.invoke('pty:resize', id, cols, rows),
    kill: (id: string) => ipcRenderer.invoke('pty:kill', id),
    list: () => ipcRenderer.invoke('pty:list'),
    onData: (id: string, callback: (data: string) => void) => {
      const listener = (_: unknown, payload: { data: string }) => callback(payload.data);
      ipcRenderer.on(`pty:data:${id}`, listener);
      return () => ipcRenderer.removeListener(`pty:data:${id}`, listener);
    },
    onExit: (id: string, callback: (payload: { exitCode: number }) => void) => {
      const listener = (_: unknown, payload: { exitCode: number }) => callback(payload);
      ipcRenderer.on(`pty:exit:${id}`, listener);
      return () => ipcRenderer.removeListener(`pty:exit:${id}`, listener);
    },
  },
});

console.log('Preload script loaded');
