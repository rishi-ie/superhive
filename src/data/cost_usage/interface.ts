/**
 * Cost & Usage domain types.
 */

export type CostUsageEntry = {
  date: string;
  cost: number;
};

export interface CostUsageStore {
  list(): CostUsageEntry[];
}
