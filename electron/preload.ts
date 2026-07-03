const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  dbQuery:   (sql: string, args?: unknown[]) => ipcRenderer.invoke('db:query',   sql, args),
  dbExecute: (sql: string, args?: unknown[]) => ipcRenderer.invoke('db:execute', sql, args),
  dbBatch:   (stmts: Array<{ sql: string; args?: unknown[] }>) => ipcRenderer.invoke('db:batch', stmts),
});

console.log('Preload script loaded');
