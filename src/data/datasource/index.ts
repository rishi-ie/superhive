/**
 * DataSource re-export shim.
 *
 * All store imports point here. The real implementation lives in
 * db-source.ts. This file ensures import paths stay stable.
 */
import { dbDataSource, bootDataSource } from './db-source';
export { dbDataSource, bootDataSource };
export const getDataSource = () => dbDataSource;
export type { DataSource } from './types';
