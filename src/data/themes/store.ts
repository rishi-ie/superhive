/**
 * Themes store — provides the full active theme list (built-in + custom).
 *
 * Built-in themes live in `data/config/themes.ts` (app structure, always loaded).
 * Custom themes come from `mockableData.customThemes`, which is the Midnight
 * theme from `mock.json` when mocks are on, or an empty array when off.
 */
import { DEFAULT_THEMES } from '@/data/config/themes';
import { mockableData } from '@/data/mock/index';
import type { Theme } from '@/data/settings/interface';
import type { ThemeStore } from './interface';

const customThemes: Theme[] = mockableData.customThemes ?? [];

export const themeStore: ThemeStore = {
  themes: [...DEFAULT_THEMES, ...customThemes],
};