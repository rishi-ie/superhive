/**
 * Cost usage store — thin wrapper over DataSource.costUsage.
 */
import { getDataSource } from '@/data/datasource/index';
import { CostUsageRepository } from './repository';
import type { CostUsageEntry } from './interface';

const repo = new CostUsageRepository(getDataSource());

export function listCostUsage(): CostUsageEntry[] {
  return repo.list();
}

export type { CostUsageEntry };
