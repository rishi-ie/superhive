/**
 * Settings storage layer — abstracts away the persistence backend.
 *
 * Electron (production): reads/writes via IPC to .superhive/settings.json in userData.
 * Browser / dev (Vite without Electron): falls back to localStorage.
 *
 * The IPC methods are wired in electron/main.ts and exposed via preload.ts as window.electron.
 * When the app runs without Electron, window.electron is undefined and we
 * seamlessly degrade to localStorage so the dev experience is unaffected.
 */
import type { Settings } from '@/data/settings/interface';
import { DEFAULT_SETTINGS, STORAGE_KEY } from '@/data/settings/interface';

/** Shape of window.electron as exposed by electron/preload.ts. */
interface ElectronStorageAPI {
  readSettings: () => Promise<string | null>;
  writeSettings: (content: string) => Promise<boolean>;
}

/** Narrow the window type to include our electron API shape. */
function getElectron(): ElectronStorageAPI | undefined {
  const w = window as unknown as { electron?: ElectronStorageAPI };
  return w.electron;
}

/** Read from localStorage (browser/dev fallback). */
function readLocal(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/** Write to localStorage (browser/dev fallback). */
function writeLocal(s: Settings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

/**
 * Read settings. Tries IPC (Electron) first, falls back to localStorage.
 * In dev without Electron, this always uses localStorage.
 */
export async function readSettings(): Promise<Settings> {
  const ep = getElectron();
  if (ep) {
    try {
      const raw = await ep.readSettings();
      if (raw) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      }
    } catch {
      // fall through to defaults
    }
  }
  return readLocal();
}

/**
 * Write settings. Tries IPC (Electron) first, falls back to localStorage.
 * In dev without Electron, this always uses localStorage.
 */
export async function writeSettings(s: Settings): Promise<void> {
  const ep = getElectron();
  if (ep) {
    try {
      const ok = await ep.writeSettings(JSON.stringify(s));
      if (ok) return;
    } catch {
      // fall through to localStorage
    }
  }
  writeLocal(s);
}
