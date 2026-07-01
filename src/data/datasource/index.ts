/**
 * DataSource factory — the single place that decides which backend is active.
 *
 * Set VITE_DATA_SOURCE to switch implementations:
 *   mock  → MockDataSource (in-memory, seeded from mock.json)  [default]
 *   db    → DbDataSource   (IPC → SQLite in Electron main)    [stub; wire later]
 *
 * Components and stores never import this directly — they receive DataSource
 * via their repository constructors. Only this file knows the active backend.
 */
import type { DataSource } from './types';
import { MockDataSource } from './mock-source';

let _instance: DataSource;

export function getDataSource(): DataSource {
  return _instance ?? (_instance = new MockDataSource());
}

export function getDataSourceSync(): DataSource {
  return getDataSource();
}
