/**
 * DataSource factory — the single place that decides which backend is active.
 *
 * Set VITE_DATA_SOURCE to switch implementations:
 *   mock  → MockDataSource (in-memory, seeded from mock.json)  [default]
 *   db    → DbDataSource   (better-sqlite3 in Electron main)  [wire later]
 *
 * Components and stores never import this directly — they receive DataSource
 * via their repository constructors. Only this file knows the active backend.
 *
 * To add a new backend: implement the DataSource interface in this directory,
 * add a branch here, and update VITE_DATA_SOURCE in .env.example.
 */
import type { DataSource } from './types';
import { MockDataSource } from './mock-source';

let _instance: DataSource;

export function getDataSource(): DataSource {
  if (_instance) return _instance;
  const source = import.meta.env.VITE_DATA_SOURCE ?? 'mock';
  void source; // wire DbDataSource below when needed
  // TODO: when DbDataSource is wired:
  // if (source === 'db') return (_instance = new DbDataSource());
  return (_instance = new MockDataSource());
}

export function getDataSourceSync(): DataSource {
  return getDataSource();
}
