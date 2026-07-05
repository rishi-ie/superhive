//#region electron/preload.ts
var { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("api", {
	agents: {
		list: () => ipcRenderer.invoke("agents:list"),
		get: (id) => ipcRenderer.invoke("agents:get", id),
		create: (data) => ipcRenderer.invoke("agents:create", data)
	},
	projects: {
		list: () => ipcRenderer.invoke("projects:list"),
		get: (id) => ipcRenderer.invoke("projects:get", id),
		create: (data) => ipcRenderer.invoke("projects:create", data)
	}
});
//#endregion
