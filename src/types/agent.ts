export type AgentStatus = 'EXECUTING' | 'COMPILING' | 'AWAITING_HUMAN' | 'IDLE' | 'ERROR_LOOP';
export type CommitAuthority = 'REVIEW_ONLY' | 'AUTO_MERGE' | 'DIRECT_MAIN';

export type AgentTelemetry = {
  contextSaturation: number;
  tokensPerSecond: number;
  currentCost: number;
  evolutionLoop: string;
  logicKernelIntegrity: number;
};

export type AgentPermissions = {
  modelEngine: string;
  writeAccess: boolean;
  commitAuthority: CommitAuthority;
  maxTokens: number;
};

export type AutonomousAgent = {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  activeDirective: string;
  telemetry: AgentTelemetry;
  permissions: AgentPermissions;
};
