import { isMockEnabled } from '@/data/mock/feature-flags';
import mockData from '@/data/mock.json';
import type { MockData } from '@/data/mock/types';
import type { CostUsageEntry, CostUsageStore } from './interface';

const data = mockData as MockData;

const emptyStore: CostUsageStore = {
  list() { return []; },
};

const mockStore: CostUsageStore = {
  list() { return data.costUsage; },
};

const store: CostUsageStore = isMockEnabled('costUsage') ? mockStore : emptyStore;

export function listCostUsage(): CostUsageEntry[] {
  return store.list();
}

export type { CostUsageEntry };
