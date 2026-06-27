import { mockableData } from '@/data/mock/index';
import type { CostUsageEntry } from './interface';

const costUsage: CostUsageEntry[] = mockableData.costUsage;

export function listCostUsage(): CostUsageEntry[] {
  return costUsage;
}

export type { CostUsageEntry };