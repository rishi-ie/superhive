import { contextBridge as e, ipcRenderer as t } from "electron";
e.exposeInMainWorld("electron", {
	platform: process.platform,
	version: process.versions.electron,
	toggleMaximize: () => t.invoke("window:toggle-maximize"),
	onMaximizedChanged: (e) => {
		let n = (t, n) => e(n);
		return t.on("window:maximized-changed", n), () => t.removeListener("window:maximized-changed", n);
	}
}), console.log("Preload script loaded");
//#endregion
export {};
