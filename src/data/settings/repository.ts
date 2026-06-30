/**
 * Settings repository — thin wrapper for settings data access.
 * Actual persistence (file vs DB) is handled by the DataSource implementation.
 * For now (PR 1-3) this is read-only; mutation hooks live in settings-context.tsx.
 */
import type { DataSource } from '@/data/datasource/types';
import type { Settings } from '@/data/settings/interface';

export class SettingsRepository {
  constructor(private _ds: DataSource) {}

  getAll(): Settings {
    // Settings live in localStorage / file layer separately from DataSource.
    // This repository exists as a forward reference for when settings
    // are unified into the DataSource abstraction in a future iteration.
    void this._ds;
    return {} as Settings; // resolved in PR 3
  }
}
