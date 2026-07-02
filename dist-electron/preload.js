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
	okf: {
		getDataDir: () => ipcRenderer.invoke("okf:get-data-dir"),
		bundleExists: (projectId) => ipcRenderer.invoke("okf:bundle-exists", projectId),
		createBundle: (projectId) => ipcRenderer.invoke("okf:create-bundle", projectId),
		readBundle: (projectId) => ipcRenderer.invoke("okf:read-bundle", projectId),
		writeConcept: (projectId, path, frontmatter, body) => ipcRenderer.invoke("okf:write-concept", projectId, path, frontmatter, body),
		readConcept: (projectId, path) => ipcRenderer.invoke("okf:read-concept", projectId, path),
		listTree: (projectId) => ipcRenderer.invoke("okf:list-tree", projectId),
		search: (projectId, query) => ipcRenderer.invoke("okf:search", projectId, query),
		deleteBundle: (projectId) => ipcRenderer.invoke("okf:delete-bundle", projectId),
		deleteAllBundles: () => ipcRenderer.invoke("okf:delete-all-bundles")
	},
	agents: {
		terminateAll: () => ipcRenderer.invoke("agents:terminate-all"),
		terminate: (ulid) => ipcRenderer.invoke("agents:terminate", ulid)
	},
	fs: {
		pathExists: (p) => ipcRenderer.invoke("fs:path-exists", p),
		ensureDir: (p) => ipcRenderer.invoke("fs:ensure-dir", p)
	},
	app: { agentsDir: () => ipcRenderer.invoke("app:agents-dir") },
	pty: {
		spawn: (id, agentPath, cols = 80, rows = 24) => ipcRenderer.invoke("pty:spawn", id, agentPath, cols, rows),
		write: (id, data) => ipcRenderer.invoke("pty:write", id, data),
		resize: (id, cols, rows) => ipcRenderer.invoke("pty:resize", id, cols, rows),
		kill: (id) => ipcRenderer.invoke("pty:kill", id),
		list: () => ipcRenderer.invoke("pty:list"),
		onData: (id, callback) => {
			const listener = (_, payload) => callback(payload.data);
			ipcRenderer.on(`pty:data:${id}`, listener);
			return () => ipcRenderer.removeListener(`pty:data:${id}`, listener);
		},
		onExit: (id, callback) => {
			const listener = (_, payload) => callback(payload);
			ipcRenderer.on(`pty:exit:${id}`, listener);
			return () => ipcRenderer.removeListener(`pty:exit:${id}`, listener);
		}
	}
});
console.log("Preload script loaded");
//#endregion
