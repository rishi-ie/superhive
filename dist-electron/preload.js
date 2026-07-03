//#region electron/preload.ts
var { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electron", {
	platform: process.platform,
	version: process.versions.electron,
	toggleMaximize: () => ipcRenderer.invoke("window:toggle-maximize"),
	onMaximizedChanged: (callback) => {
		const listener = (_, isMaximized) => callback(isMaximized);
		ipcRenderer.on("window:maximized-changed", listener);
		return () => ipcRenderer.removeListener("window:maximized-changed", listener);
	},
	getDataDir: () => ipcRenderer.invoke("app:get-data-dir"),
	readSettings: () => ipcRenderer.invoke("settings:read"),
	writeSettings: (content) => ipcRenderer.invoke("settings:write", content),
	dbQuery: (sql, args) => ipcRenderer.invoke("db:query", sql, args),
	dbExecute: (sql, args) => ipcRenderer.invoke("db:execute", sql, args),
	dbBatch: (stmts) => ipcRenderer.invoke("db:batch", stmts),
	dbExecMulti: (sql) => ipcRenderer.invoke("db:exec-multi", sql),
	onWsEvent: (callback) => {
		const listener = (_, payload) => callback(payload);
		ipcRenderer.on("ws:event", listener);
		return () => ipcRenderer.removeListener("ws:event", listener);
	},
	agents: {
		terminateAll: () => ipcRenderer.invoke("agents:terminate-all"),
		terminate: (ulid) => ipcRenderer.invoke("agents:terminate", ulid)
	}
});
console.log("Preload script loaded");
//#endregion
