/**
 * sub_agents store — public API for agent subprocess registry.
 */
import { getDataSource } from '@/data/datasource/index';
import { SubAgentsRepository } from './repository';
import type { SubAgent } from './interface';

const repo = new SubAgentsRepository(getDataSource());

export function listSubAgents(): SubAgent[] {
  return repo.list();
}

export function getSubAgent(id: string): SubAgent | undefined {
  return repo.get(id);
}

export function listSubAgentsByParent(parentUlid: string): SubAgent[] {
  return repo.listByParent(parentUlid);
}

export function registerSubAgent(opts: { id: string; parentUlid: string; name: string; kind: string; task?: string }): SubAgent {
  return repo.register(opts);
}

export function setSubAgentStatus(id: string, status: string): void {
  repo.setStatus(id, status);
}

export function finishSubAgent(id: string): void {
  repo.finish(id);
}

export type { SubAgent };
