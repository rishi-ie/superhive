import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  platform: NodeJS.Platform;
  version: string;
  toggleMaximize: () => void;
  onMaximizedChanged: (callback: (isMaximized: boolean) => void) => () => void;
  /** Returns the path to the app's user data directory (where .superhive/ lives). */
  getDataDir: () => Promise<string>;
  /** Reads the raw content of settings.json from .superhive/settings.json. */
  readSettings: () => Promise<string | null>;
  /** Writes raw content to .superhive/settings.json. */
  writeSettings: (content: string) => Promise<boolean>;
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
  getDataDir: () => ipcRenderer.invoke('app:get-data-dir'),
  readSettings: () => ipcRenderer.invoke('settings:read'),
  writeSettings: (content: string) => ipcRenderer.invoke('settings:write', content),
} satisfies ElectronAPI);

console.log('Preload script loaded');
