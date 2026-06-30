type ElectronAPI = {
  platform: NodeJS.Platform;
  version: string;
  toggleMaximize: () => Promise<void>;
  onMaximizedChanged: (callback: (isMaximized: boolean) => void) => () => void;
  /** Returns the path to the app's user data directory (where .superhive/ lives). */
  getDataDir: () => Promise<string>;
  /** Reads raw content of .superhive/settings.json. Returns null if absent. */
  readSettings: () => Promise<string | null>;
  /** Writes raw content to .superhive/settings.json. */
  writeSettings: (content: string) => Promise<boolean>;
};

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};
