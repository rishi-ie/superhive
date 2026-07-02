/**
 * agent_processes repository — thin wrapper over DataSource.agentProcesses.
 */
import type { DataSource } from '@/data/datasource/types';
import type { AgentProcess } from './interface';

export class AgentProcessesRepository {
  constructor(private ds: DataSource) {}

  list(): AgentProcess[] {
    return this.ds.agentProcesses.findAll() as AgentProcess[];
  }

  get(ulid: string): AgentProcess | undefined {
    return this.ds.agentProcesses.findByUlid(ulid) as AgentProcess | undefined;
  }

  listByWorkspace(workspaceId: string): AgentProcess[] {
    return this.list().filter((p) => p.workspaceId === workspaceId);
  }

  register(ulid: string, pid: number, workspaceId?: string, projectId?: string): AgentProcess {
    return this.ds.agentProcesses.upsert({
      ulid,
      pid,
      status: 'STARTING',
      startedAt: new Date().toISOString(),
      workspaceId: workspaceId ?? null,
      projectId: projectId ?? null,
    }) as AgentProcess;
  }

  setStatus(ulid: string, status: string): void {
    this.ds.agentProcesses.setStatus(ulid, status);
  }

  recordHeartbeat(ulid: string): void {
    this.ds.agentProcesses.recordHeartbeat(ulid);
  }

  terminate(ulid: string): boolean {
    return this.ds.agentProcesses.remove(ulid);
  }
}
