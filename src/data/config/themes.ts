/**
 * Built-in theme definitions. Each theme is a map of CSS variable overrides
 * applied to :root when the user picks that theme (or system).
 *
 * Custom themes (from backend) are merged in at runtime via the themes/ store.
 * The built-in list here serves as the seed/defaults.
 */
import type { Theme } from '@/data/settings/interface';
import { ALL_CSS_VARS } from '@/data/config/css-vars';

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
      '--accent': '#0562EF',
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
      '--sidebar-primary': '#0562EF',
      '--sidebar-primary-foreground': '#ffffff',
      '--sidebar-accent': '#e8e4e0',
      '--sidebar-accent-foreground': '#1a1716',
      '--sidebar-border': '#d0cbc6',
      '--sidebar-ring': '#b0a89e',
      '--highlight-match': 'rgba(5, 98, 239, 0.15)',
      '--highlight-active': 'rgba(5, 98, 239, 0.4)',
      '--highlight': '#0562EF',
      '--highlight-foreground': '#ffffff',
      '--overlay': 'rgb(0 0 0 / 0.5)',
      '--hover-tint': 'rgb(0 0 0 / 0.04)',
      '--switch-thumb-shadow': '0 1px 3px rgb(0 0 0 / 0.15), inset 0 0 0 0.5px rgb(0 0 0 / 0.05)',
    },
  },
  {
    id: 'system',
    name: 'System',
    vars: {},
    systemVars: {},
  },
];

/**
 * Set of every CSS variable that can be themed.
 * Built from the canonical ALL_CSS_VARS list — ALL vars are cleared
 * before applying a new theme so no stale values persist.
 */
export const ALL_THEME_VARS: Set<string> = new Set(ALL_CSS_VARS);