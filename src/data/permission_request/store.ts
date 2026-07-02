/**
 * permission_requests store — public API for agent permission requests.
 */
import { getDataSource } from '@/data/datasource/index';
import { PermissionRequestsRepository } from './repository';
import type { PermissionRequest } from './interface';

const repo = new PermissionRequestsRepository(getDataSource());

export function listPermissionRequests(): PermissionRequest[] {
  return repo.list();
}

export function getPermissionRequest(id: string): PermissionRequest | undefined {
  return repo.get(id);
}

export function listPermissionRequestsByAgent(agentUlid: string): PermissionRequest[] {
  return repo.listByAgent(agentUlid);
}

export function createPermissionRequest(opts: { agentUlid: string; action: string; toolName?: string; args?: Record<string, unknown> }): PermissionRequest {
  return repo.create(opts);
}

export function resolvePermissionRequest(id: string, status: 'GRANTED' | 'DENIED' | 'EXPIRED', note?: string): void {
  repo.resolve(id, status, note);
}

export type { PermissionRequest };
