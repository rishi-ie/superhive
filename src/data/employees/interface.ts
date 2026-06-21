import type { AgentStatus } from '@/types/agent';

export type EmployeeStatus = 'EXECUTING' | 'COMPILING' | 'AWAITING_HUMAN' | 'IDLE' | 'ERROR_LOOP';

export type Employee = {
  id: string;
  name: string;
  role: string;
  status: EmployeeStatus;
  activeTask: string;
  uptime: string;
};

export type Telemetry = {
  contextSaturation: number;
  tokensPerSecond: number;
  currentCost: number;
  evolutionLoop: string;
  logicKernelIntegrity: number;
  sessionCost: number;
  budget: number;
};

export type AuditItem = {
  id: string;
  type: 'AUTH_INTERCEPT' | 'DIFF_REVIEW';
  title: string;
  description: string;
  timestamp: string;
};

export type Permissions = {
  modelEngine: string;
  writeAccess: boolean;
  commitAuthority: 'REVIEW_ONLY' | 'AUTO_MERGE' | 'DIRECT_MAIN';
  maxTokens: number;
  writeMessages: boolean;
  installDeps: boolean;
};

export type ActionLogEntry = {
  time: string;
  action: string;
};

export interface EmployeeStore {
  list(): Employee[];
  get(id: string): Employee | undefined;
  getTelemetry(employeeId: string): Telemetry | null;
  getPermissions(employeeId: string): Permissions | null;
  getAuditItems(employeeId?: string): AuditItem[];
  getActionLog(employeeId: string): ActionLogEntry[];
  getNextStep(employeeId: string): string;
  getDefaultTelemetry(): Telemetry;
  getDefaultPermissions(): Permissions;
}
