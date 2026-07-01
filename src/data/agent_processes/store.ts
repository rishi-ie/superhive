/**
 * agent_processes store — public API for agent subprocess registry.
 */
import { getDataSource } from '@/data/datasource/index';
import { AgentProcessesRepository } from './repository';
import type { AgentProcess } from './interface';

const repo = new AgentProcessesRepository(getDataSource());

export function listAgentProcesses(): AgentProcess[] {
  return repo.list();
}

export function getAgentProcess(ulid: string): AgentProcess | undefined {
  return repo.get(ulid);
}

export function listAgentProcessesByWorkspace(workspaceId: string): AgentProcess[] {
  return repo.listByWorkspace(workspaceId);
}

export function registerAgentProcess(ulid: string, pid: number, workspaceId?: string, projectId?: string): AgentProcess {
  return repo.register(ulid, pid, workspaceId, projectId);
}

export function setAgentProcessStatus(ulid: string, status: string): void {
  repo.setStatus(ulid, status);
}

export function recordAgentHeartbeat(ulid: string): void {
  repo.recordHeartbeat(ulid);
}

export function terminateAgentProcess(ulid: string): boolean {
  return repo.terminate(ulid);
}

export type { AgentProcess };
