/**
 * Themes store — provides the full active theme list (built-in + custom).
 *
 * Delegates to ThemesRepository, which merges DEFAULT_THEMES (always loaded)
 * with custom themes from DataSource.themes.
 */
import { DEFAULT_THEMES } from '@/data/config/themes';
import { getDataSource } from '@/data/datasource/index';
import { ThemesRepository } from './repository';
import type { ThemeStore } from './interface';

const repo = new ThemesRepository(getDataSource());

export const themeStore: ThemeStore = {
  themes: [...DEFAULT_THEMES, ...repo.getCustom()],
};
