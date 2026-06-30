/**
 * Themes repository — read-only wrapper over DataSource.themes + built-in DEFAULT_THEMES.
 * Built-in themes live in data/config/themes.ts (always loaded).
 * Custom themes come from DataSource.themes.
 */
import type { DataSource } from '@/data/datasource/types';
import type { Theme } from '@/data/settings/interface';
import { DEFAULT_THEMES } from '@/data/config/themes';

export class ThemesRepository {
  constructor(private ds: DataSource) {}

  list(): Theme[] {
    return [...DEFAULT_THEMES, ...this.ds.themes.findAll()];
  }

  getDefault(): Theme[] {
    return DEFAULT_THEMES;
  }

  getCustom(): Theme[] {
    return this.ds.themes.findAll();
  }
}

export function createThemesRepository(ds: DataSource): ThemesRepository {
  return new ThemesRepository(ds);
}
