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
	}
});
console.log("Preload script loaded");
//#endregion
export {};
