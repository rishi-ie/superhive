import { isMockEnabled } from '@/data/mock/feature-flags';
import mockData from '../mock.json';
import type { MockData } from '../mock/types';

const data = mockData as MockData;

export type CostUsageEntry = {
  date: string;
  cost: number;
};

interface CostUsageStore {
  list(): CostUsageEntry[];
}

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
