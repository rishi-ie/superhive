/**
 * Cost usage repository — read-only wrapper over DataSource.costUsage.
 */
import type { DataSource } from '@/data/datasource/types';
import type { CostUsageEntry } from './interface';

export class CostUsageRepository {
  constructor(private ds: DataSource) {}

  list(): CostUsageEntry[] {
    return this.ds.costUsage.findAll();
  }
}

export function createCostUsageRepository(ds: DataSource): CostUsageRepository {
  return new CostUsageRepository(ds);
}
