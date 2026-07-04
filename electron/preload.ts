const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electron', {});

console.log('Preload script loaded');
