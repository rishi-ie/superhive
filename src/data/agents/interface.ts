export interface Agent {
  id: string;
  workspaceId: string;
  name: string;
  status: string;
}
export interface Telemetry {
  agentId: string;
  contextSaturation: number;
  tokensPerSecond: number;
  currentCost: number;
  evolutionLoop: string;
  logicKernelIntegrity: number;
  sessionCost: number;
  budget: number;
}
export interface Permissions {
  agentId: string;
  modelEngine: string;
  writeAccess: boolean;
  commitAuthority: string;
  maxTokens: number;
  writeMessages: boolean;
  installDeps: boolean;
}
export interface AuditItem {
  id: string;
  agentId: string;
  time: string;
  action: string;
}
export interface PendingQuestion {
  id: string;
  agentId: string;
  step: string;
  status: string;
  requestedAt: string;
}
