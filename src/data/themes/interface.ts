/**
 * Themes domain types — the active theme list (built-in + custom).
 */
import type { Theme } from '@/data/settings/interface';

export type { Theme };

export type ThemeStore = {
  themes: Theme[];
};
