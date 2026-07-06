//#region electron/preload.ts
var { contextBridge, ipcRenderer } = require("electron");
function subscribe(channel, cb) {
	const listener = (_event, payload) => cb(payload);
	ipcRenderer.on(channel, listener);
	return () => ipcRenderer.removeListener(channel, listener);
}
contextBridge.exposeInMainWorld("api", {
	agents: {
		list: () => ipcRenderer.invoke("agents:list"),
		get: (id) => ipcRenderer.invoke("agents:get", id),
		create: (data) => ipcRenderer.invoke("agents:create", data),
		delete: (id) => ipcRenderer.invoke("agents:delete", id),
		updateStatus: (id, status, lastError) => ipcRenderer.invoke("agents:updateStatus", id, status, lastError),
		start: (id) => ipcRenderer.invoke("agents:start", id),
		stop: (id) => ipcRenderer.invoke("agents:stop", id),
		restart: (id) => ipcRenderer.invoke("agents:restart", id),
		send: (id, message) => ipcRenderer.invoke("agents:send", id, message),
		getRuntimeState: (id) => ipcRenderer.invoke("agents:getRuntimeState", id),
		onEvent: (id, cb) => subscribe(`agent:${id}:event`, cb),
		onStatus: (id, cb) => subscribe(`agent:${id}:status`, cb),
		onMessages: (id, cb) => subscribe(`agent:${id}:messages`, cb),
		onExit: (id, cb) => subscribe(`agent:${id}:exit`, cb)
	},
	manifestPi: {
		ensureTemplate: () => ipcRenderer.invoke("manifest-pi:ensureTemplate"),
		checkTemplate: () => ipcRenderer.invoke("manifest-pi:checkTemplate")
	},
	projects: {
		list: () => ipcRenderer.invoke("projects:list"),
		get: (id) => ipcRenderer.invoke("projects:get", id),
		create: (data) => ipcRenderer.invoke("projects:create", data)
	}
});
//#endregion
