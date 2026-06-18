import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  platform: NodeJS.Platform;
  version: string;
  toggleMaximize: () => void;
  onMaximizedChanged: (callback: (isMaximized: boolean) => void) => () => void;
}

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  version: process.versions.electron,
  toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
  onMaximizedChanged: (callback: (isMaximized: boolean) => void) => {
    const listener = (_: unknown, isMaximized: boolean) => callback(isMaximized);
    ipcRenderer.on('window:maximized-changed', listener);
    return () => ipcRenderer.removeListener('window:maximized-changed', listener);
  },
} satisfies ElectronAPI);

console.log('Preload script loaded');
