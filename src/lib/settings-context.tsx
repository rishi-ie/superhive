/**
 * Settings context and hook — wraps settings store with React context.
 *
 * Persistence backend is handled by settings/storage.ts:
 *   - Electron: writes to .superhive/settings.json via IPC
 *   - Browser/dev: falls back to localStorage
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_SETTINGS,
  type Settings,
  type SettingsStore,
  type Theme,
} from '@/data/settings/interface';
import { ALL_THEME_VARS, DEFAULT_THEMES } from '@/data/config/themes';
import { debounce } from '@/lib/debounce';
import { readSettings, writeSettings } from '@/data/settings/storage';

export { DEFAULT_THEMES };
export type { Theme };

function computeHighlightForeground(highlight: string): string {
  const hex = highlight.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 140 ? '#121212' : '#ffffff';
}

function applySettingsToDOM(settings: Settings) {
  const root = document.documentElement;
  const themes = DEFAULT_THEMES;

  ALL_THEME_VARS.forEach((k) => root.style.removeProperty(k));

  const selectedId = settings.appearance.theme;
  const isSystemMode = selectedId === 'system';
  const isDarkOS = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (isSystemMode) {
    const prefersDark = isDarkOS;
    const sysTheme = themes.find((t) => t.id === 'system') ?? themes[0]!;
    if (prefersDark) {
      Object.entries(sysTheme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    } else if (sysTheme.systemVars) {
      Object.entries(sysTheme.systemVars).forEach(([k, v]) => root.style.setProperty(k, v));
    } else {
      Object.entries(sysTheme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    }
    root.setAttribute('data-theme', 'system');
  } else {
    const theme = themes.find((t) => t.id === selectedId) ?? themes[0]!;
    Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    root.setAttribute('data-theme', theme.id);
  }

  root.setAttribute('data-font-scale', String(settings.appearance.fontScale));
  root.style.fontSize = `${settings.appearance.fontScale}rem`;

  root.setAttribute('data-reduce-motion', String(settings.appearance.reduceMotion));

  const highlight = settings.appearance.highlightColor;
  const highlightFg = computeHighlightForeground(highlight);

  root.style.setProperty('--highlight', highlight);
  root.style.setProperty('--highlight-foreground', highlightFg);
  root.style.setProperty('--highlight-match', `${highlight}33`);
  root.style.setProperty('--highlight-active', `${highlight}80`);
}

const SettingsContext = createContext<SettingsStore | null>(null);

/**
 * @param children - App content wrapped by the settings context
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const isFirstRender = useRef(true);

  useEffect(() => {
    readSettings().then((loaded) => {
      setSettings(loaded);
      applySettingsToDOM(loaded);
    });
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      applySettingsToDOM(settings);
    }
  }, [settings]);

  const persist = useCallback(
    debounce((s: Settings) => {
      writeSettings(s);
    }, 300),
    [],
  );

  const update = useCallback(
    <K extends keyof Settings>(domain: K, patch: Partial<Settings[K]>) => {
      setSettings((prev) => {
        const next = { ...prev, [domain]: { ...prev[domain], ...patch } };
        persist(next);
        applySettingsToDOM(next);
        return next;
      });
    },
    [persist],
  );

  const resetAll = useCallback(() => {
    const next = { ...DEFAULT_SETTINGS };
    setSettings(next);
    persist(next);
    applySettingsToDOM(next);
  }, [persist]);

  const exportJson = useCallback(() => {
    return JSON.stringify(settings, null, 2);
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, update, resetAll, exportJson }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsStore {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within <SettingsProvider>');
  return ctx;
}
