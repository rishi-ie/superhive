type ElectronAPI = {
  platform: NodeJS.Platform;
  version: string;
  toggleMaximize: () => Promise<void>;
  onMaximizedChanged: (callback: (isMaximized: boolean) => void) => () => void;
};

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};
