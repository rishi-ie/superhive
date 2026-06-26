/**
 * Built-in theme definitions. Each theme is a map of CSS variable overrides
 * applied to :root when the user picks that theme (or system).
 */
import type { Theme } from '@/data/settings/interface';

export const DEFAULT_THEMES: Theme[] = [
  {
    id: 'dark',
    name: 'Dark',
    vars: {},
  },
  {
    id: 'light',
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
    id: 'system',
    name: 'System',
    vars: {},
  },
];

/** Set of every CSS variable any theme touches — used to clear stale overrides. */
export const ALL_THEME_VARS: Set<string> = new Set(
  DEFAULT_THEMES.flatMap((t) => Object.keys(t.vars))
);