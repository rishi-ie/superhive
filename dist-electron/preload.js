//#region electron/preload.ts
var { contextBridge } = require("electron");
contextBridge.exposeInMainWorld("electron", {});
console.log("Preload script loaded");
//#endregion
