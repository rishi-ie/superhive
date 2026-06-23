import type {
  Agent,
  Telemetry,
  Permissions,
  AuditItem,
  ActionLogEntry,
} from './interface';

interface AgentsApi {
  list(): Promise<Agent[]>;
  get(id: string): Promise<Agent | undefined>;
  getTelemetry(agentId: string): Promise<Telemetry | null>;
  getPermissions(agentId: string): Promise<Permissions | null>;
  getAuditItems(agentId?: string): Promise<AuditItem[]>;
  getActionLog(agentId: string): Promise<ActionLogEntry[]>;
  getNextStep(agentId: string): Promise<string>;
  approveAudit(id: string): Promise<void>;
  denyAudit(id: string): Promise<void>;
}

export const agentsApi: AgentsApi = {
  list() { throw new Error('Not implemented — replace with real API call'); },
  get() { throw new Error('Not implemented — replace with real API call'); },
  getTelemetry() { throw new Error('Not implemented — replace with real API call'); },
  getPermissions() { throw new Error('Not implemented — replace with real API call'); },
  getAuditItems() { throw new Error('Not implemented — replace with real API call'); },
  getActionLog() { throw new Error('Not implemented — replace with real API call'); },
  getNextStep() { throw new Error('Not implemented — replace with real API call'); },
  approveAudit() { throw new Error('Not implemented — replace with real API call'); },
  denyAudit() { throw new Error('Not implemented — replace with real API call'); },
};
