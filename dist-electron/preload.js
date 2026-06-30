import { contextBridge, ipcRenderer } from "electron";
//#region electron/preload.ts
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
	writeSettings: (content) => ipcRenderer.invoke("settings:write", content)
});
console.log("Preload script loaded");
//#endregion
export {};
