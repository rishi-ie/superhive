/**
 * Themes store — provides the full active theme list (built-in + custom).
 *
 * Without a real backend, returns DEFAULT_THEMES. Custom themes from a backend
 * would be merged here (or returned by an API call in a full implementation).
 */
import { DEFAULT_THEMES } from '@/data/config/themes';
import { isMockEnabled } from '@/data/mock/feature-flags';
import type { Theme } from '@/data/settings/interface';
import type { ThemeStore } from './interface';

const MOCK_CUSTOM_THEMES: Theme[] = [
  {
    id: 'custom:midnight',
    name: 'Midnight',
    vars: {
      '--background': '#0f1117',
      '--foreground': '#c9d1d9',
      '--card': '#161b22',
      '--card-foreground': '#c9d1d9',
      '--popover': '#161b22',
      '--popover-foreground': '#c9d1d9',
      '--primary': '#c9d1d9',
      '--primary-foreground': '#0f1117',
      '--secondary': '#21262d',
      '--secondary-foreground': '#c9d1d9',
      '--muted': '#21262d',
      '--muted-foreground': '#8b949e',
      '--accent': '#58a6ff',
      '--accent-foreground': '#ffffff',
      '--tertiary': '#1c2128',
      '--tertiary-active': '#252b33',
      '--destructive': '#f85149',
      '--destructive-foreground': '#ffffff',
      '--border': '#30363d',
      '--input': '#30363d',
      '--ring': '#58a6ff',
      '--sidebar': '#0d1117',
      '--sidebar-foreground': '#c9d1d9',
      '--sidebar-primary': '#58a6ff',
      '--sidebar-primary-foreground': '#0f1117',
      '--sidebar-accent': '#21262d',
      '--sidebar-accent-foreground': '#c9d1d9',
      '--sidebar-border': '#30363d',
      '--sidebar-ring': '#58a6ff',
      '--highlight-match': 'rgba(88, 166, 255, 0.2)',
      '--highlight-active': 'rgba(88, 166, 255, 0.5)',
      '--highlight': '#58a6ff',
      '--highlight-foreground': '#0f1117',
      '--overlay': 'rgb(0 0 0 / 0.8)',
      '--hover-tint': 'rgb(255 255 255 / 0.05)',
      '--switch-thumb-shadow': '0 1px 3px rgb(0 0 0 / 0.4), inset 0 0 0 0.5px rgb(255 255 255 / 0.1)',
    },
    systemVars: {
      '--background': '#ffffff',
      '--foreground': '#1a1716',
      '--card': '#ffffff',
      '--card-foreground': '#1a1716',
      '--popover': '#ffffff',
      '--popover-foreground': '#1a1716',
      '--primary': '#1a1716',
      '--primary-foreground': '#ffffff',
      '--secondary': '#f0ede8',
      '--secondary-foreground': '#1a1716',
      '--muted': '#f0ede8',
      '--muted-foreground': '#6b6560',
      '--accent': '#58a6ff',
      '--accent-foreground': '#ffffff',
      '--tertiary': '#e8e4e0',
      '--tertiary-active': '#ddd9d5',
      '--destructive': '#f85149',
      '--destructive-foreground': '#ffffff',
      '--border': '#d0cbc6',
      '--input': '#d0cbc6',
      '--ring': '#58a6ff',
      '--sidebar': '#f5f2ef',
      '--sidebar-foreground': '#1a1716',
      '--sidebar-primary': '#58a6ff',
      '--sidebar-primary-foreground': '#ffffff',
      '--sidebar-accent': '#e8e4e0',
      '--sidebar-accent-foreground': '#1a1716',
      '--sidebar-border': '#d0cbc6',
      '--sidebar-ring': '#58a6ff',
      '--highlight-match': 'rgba(88, 166, 255, 0.15)',
      '--highlight-active': 'rgba(88, 166, 255, 0.4)',
      '--highlight': '#58a6ff',
      '--highlight-foreground': '#ffffff',
      '--overlay': 'rgb(0 0 0 / 0.5)',
      '--hover-tint': 'rgb(0 0 0 / 0.04)',
      '--switch-thumb-shadow': '0 1px 3px rgb(0 0 0 / 0.15), inset 0 0 0 0.5px rgb(0 0 0 / 0.05)',
    },
  },
];

function listThemes(): Theme[] {
  if (!isMockEnabled('themes')) return DEFAULT_THEMES;
  return [...DEFAULT_THEMES, ...MOCK_CUSTOM_THEMES];
}

export const themeStore: ThemeStore = {
  themes: listThemes(),
};
