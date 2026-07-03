//#region electron/preload.ts
var { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electron", {
	readSettings: () => ipcRenderer.invoke("settings:read"),
	writeSettings: (content) => ipcRenderer.invoke("settings:write", content),
	dbQuery: (sql, args) => ipcRenderer.invoke("db:query", sql, args),
	dbExecute: (sql, args) => ipcRenderer.invoke("db:execute", sql, args),
	dbBatch: (stmts) => ipcRenderer.invoke("db:batch", stmts)
});
console.log("Preload script loaded");
//#endregion
