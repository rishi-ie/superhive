const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  readSettings: () => ipcRenderer.invoke('settings:read'),
  writeSettings: (content: string) => ipcRenderer.invoke('settings:write', content),
  dbQuery: (sql: string, args?: unknown[]) => ipcRenderer.invoke('db:query', sql, args),
  dbExecute: (sql: string, args?: unknown[]) => ipcRenderer.invoke('db:execute', sql, args),
  dbBatch: (stmts: Array<{ sql: string; args?: unknown[] }>) => ipcRenderer.invoke('db:batch', stmts),
});

console.log('Preload script loaded');
