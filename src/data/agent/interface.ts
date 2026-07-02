export type AgentStatus = 'EXECUTING' | 'COMPILING' | 'AWAITING_HUMAN' | 'IDLE' | 'ERROR_LOOP';

export type Agent = {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  activeTask: string;
  uptime: string;
  principles?: string;
  boundaries?: string;
  skills?: string[];
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
  agentId: string;
  scope?: string;
  prId?: string;
  touchedFiles?: number;
};

export type PendingQuestion = {
  id: string;
  agentId: string;
  threadId?: string;
  messageId?: string;
  question: string;
  options?: string[];
  timestamp: string;
};

export type CommitAuthority = 'REVIEW_ONLY' | 'AUTO_MERGE' | 'DIRECT_MAIN';

export type Permissions = {
  modelEngine: string;
  writeAccess: boolean;
  commitAuthority: CommitAuthority;
  maxTokens: number;
  writeMessages: boolean;
  installDeps: boolean;
};

export type ActionLogEntry = {
  time: string;
  action: string;
};

export interface AgentStore {
  list(): Agent[];
  get(id: string): Agent | undefined;
  getTelemetry(agentId: string): Telemetry | null;
  getPermissions(agentId: string): Permissions | null;
  getAuditItems(agentId?: string): AuditItem[];
  getPendingQuestions(agentId: string): PendingQuestion[];
  getActionLog(agentId: string): ActionLogEntry[];
  getNextStep(agentId: string): string;
  getDefaultTelemetry(): Telemetry;
  getDefaultPermissions(): Permissions;
  setPermissions(agentId: string, permissions: Permissions): void;
  approveAudit(id: string): void;
  denyAudit(id: string): void;
  answerQuestion(id: string, answer: string, agentId: string): void;
}
