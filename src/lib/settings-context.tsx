/**
 * Settings context and hook — wraps settings store with React context and localStorage persistence.
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
  STORAGE_KEY,
  type Settings,
  type SettingsStore,
} from '@/data/settings/interface';
import { debounce } from '@/lib/debounce';

const DEFAULT_THEMES = [
  {
    id: 'dark' as const,
    name: 'Dark',
    vars: {},
  },
  {
    id: 'light' as const,
    name: 'Light',
    vars: {
      '--background': '#f5f2ef',
      '--foreground': '#1a1716',
      '--card': '#ffffff',
      '--card-foreground': '#1a1716',
      '--popover': '#ffffff',
      '--popover-foreground': '#1a1716',
      '--primary': '#1a1716',
      '--primary-foreground': '#f5f2ef',
      '--secondary': '#e8e4e0',
      '--secondary-foreground': '#1a1716',
      '--muted': '#e8e4e0',
      '--muted-foreground': '#6b6560',
      '--accent': '#e07850',
      '--accent-foreground': '#ffffff',
      '--tertiary': '#ddd9d5',
      '--tertiary-active': '#d0cbc6',
      '--destructive': '#cc4444',
      '--destructive-foreground': '#ffffff',
      '--border': '#d0cbc6',
      '--input': '#d0cbc6',
      '--ring': '#b0a89e',
      '--sidebar': '#f5f2ef',
      '--sidebar-foreground': '#1a1716',
      '--sidebar-primary': '#e07850',
      '--sidebar-primary-foreground': '#ffffff',
      '--sidebar-accent': '#e8e4e0',
      '--sidebar-accent-foreground': '#1a1716',
      '--sidebar-border': '#d0cbc6',
      '--sidebar-ring': '#b0a89e',
      '--highlight-match': 'rgba(224, 120, 80, 0.15)',
      '--highlight-active': 'rgba(224, 120, 80, 0.4)',
      '--highlight': '#e07850',
      '--highlight-foreground': '#ffffff',
    },
  },
  {
    id: 'system' as const,
    name: 'System',
    vars: {},
  },
];

export { DEFAULT_THEMES };
export type { Theme } from '@/data/settings/interface';

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function applySettingsToDOM(settings: Settings) {
  const root = document.documentElement;

  const theme = DEFAULT_THEMES.find(t => t.id === settings.appearance.theme) ?? DEFAULT_THEMES[0]!;
  const vars = theme.vars;

  if (settings.appearance.theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const sysTheme = prefersDark ? DEFAULT_THEMES[0]! : DEFAULT_THEMES[1]!;
    Object.entries(sysTheme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    root.setAttribute('data-theme', 'system');
  } else {
    if (Object.keys(vars).length > 0) {
      Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    }
    root.setAttribute('data-theme', theme.id);
  }

  root.setAttribute('data-font-scale', String(settings.appearance.fontScale));
  root.style.fontSize = `${settings.appearance.fontScale}rem`;

  root.setAttribute('data-reduce-motion', String(settings.appearance.reduceMotion || settings.accessibility.reduceMotion));

  root.style.setProperty('--highlight', settings.appearance.accentColor);
  root.style.setProperty('--highlight-foreground', '#ffffff');
  root.style.setProperty('--sidebar-primary', settings.appearance.accentColor);
  root.style.setProperty('--chart-1', settings.appearance.accentColor);
}

const SettingsContext = createContext<SettingsStore | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      applySettingsToDOM(settings);
    }
  }, [settings]);

  const persist = useCallback(
    debounce((s: Settings) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      } catch {
        // storage full or unavailable
      }
    }, 300),
    []
  );

  const update = useCallback(<K extends keyof Settings>(domain: K, patch: Partial<Settings[K]>) => {
    setSettings(prev => {
      const next = { ...prev, [domain]: { ...prev[domain], ...patch } };
      persist(next);
      applySettingsToDOM(next);
      return next;
    });
  }, [persist]);

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
