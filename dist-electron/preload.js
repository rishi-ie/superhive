import { contextBridge } from "electron";
//#region electron/preload.ts
contextBridge.exposeInMainWorld("electron", {
	platform: process.platform,
	version: process.versions.electron
});
console.log("Preload script loaded");
//#endregion
export {};
