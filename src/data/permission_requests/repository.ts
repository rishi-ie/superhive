/**
 * permission_requests repository — thin wrapper over DataSource.permissionRequests.
 */
import type { DataSource } from '@/data/datasource/types';
import type { PermissionRequest } from './interface';

export class PermissionRequestsRepository {
  constructor(private ds: DataSource) {}

  list(): PermissionRequest[] {
    return this.ds.permissionRequests.findAll() as PermissionRequest[];
  }

  get(id: string): PermissionRequest | undefined {
    return this.ds.permissionRequests.findById(id) as PermissionRequest | undefined;
  }

  listByAgent(agentUlid: string): PermissionRequest[] {
    return this.ds.permissionRequests.listByAgent(agentUlid) as PermissionRequest[];
  }

  create(opts: { agentUlid: string; action: string; toolName?: string; args?: Record<string, unknown> }): PermissionRequest {
    return this.ds.permissionRequests.create({
      agentUlid: opts.agentUlid,
      action: opts.action,
      toolName: opts.toolName ?? null,
      argsJson: opts.args ? JSON.stringify(opts.args) : null,
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
      resolvedAt: null,
      resolverNote: null,
    }) as PermissionRequest;
  }

  resolve(id: string, status: 'GRANTED' | 'DENIED' | 'EXPIRED', note?: string): void {
    this.ds.permissionRequests.resolve(id, status, note);
  }
}
