import { mockableData } from '@/data/mock/index';
import type { AgentStore, Agent, Telemetry, Permissions, AuditItem, ActionLogEntry } from './interface';
import type { Project } from '@/data/projects/interface';

const projects: Project[] = mockableData.projects;
const agents: Agent[] = mockableData.agents;
const telemetryMap: Record<string, Telemetry> = mockableData.telemetry;
const permissionsMap: Record<string, Permissions> = mockableData.permissions;
const actionLogMap: Record<string, ActionLogEntry[]> = mockableData.actionLogs;
const nextStepMap: Record<string, string> = mockableData.nextSteps;

let auditItemsMutable: AuditItem[] = structuredClone(mockableData.auditItems);

const DEFAULT_TELEMETRY: Telemetry = {
  contextSaturation: 50, tokensPerSecond: 0, currentCost: 0, evolutionLoop: '0/100', logicKernelIntegrity: 100, sessionCost: 0, budget: 5.00,
};

const DEFAULT_PERMISSIONS: Permissions = {
  modelEngine: 'Opus 4.8', writeAccess: false, commitAuthority: 'REVIEW_ONLY', maxTokens: 8192, writeMessages: false, installDeps: false,
};

const store: AgentStore = {
  list() {
    return agents;
  },
  get(id: string) {
    return agents.find((a) => a.id === id);
  },
  getTelemetry(agentId: string) {
    return telemetryMap[agentId] ?? null;
  },
  getPermissions(agentId: string) {
    return permissionsMap[agentId] ?? null;
  },
  getAuditItems(_agentId?: string) {
    return auditItemsMutable;
  },
  getActionLog(agentId: string) {
    return actionLogMap[agentId] ?? [];
  },
  getNextStep(agentId: string) {
    return nextStepMap[agentId] ?? 'Next — Standing by';
  },
  getDefaultTelemetry() {
    return DEFAULT_TELEMETRY;
  },
  getDefaultPermissions() {
    return DEFAULT_PERMISSIONS;
  },
  approveAudit(id: string) {
    auditItemsMutable = auditItemsMutable.filter(item => item.id !== id);
  },
  denyAudit(id: string) {
    auditItemsMutable = auditItemsMutable.filter(item => item.id !== id);
  },
};

export function listAgents(): Agent[] {
  return store.list();
}

export function getAgent(id: string): Agent | undefined {
  return store.get(id);
}

export function getActiveAgent(preferredId?: string | null): Agent | null {
  const agents = store.list();
  if (preferredId) {
    return agents.find(a => a.id === preferredId) ?? agents[0] ?? null;
  }
  return (
    agents.find((a) => a.status === 'EXECUTING') ??
    agents.find((a) => a.status === 'COMPILING') ??
    agents[0] ??
    null
  );
}

export function getTelemetry(agentId: string): Telemetry {
  return store.getTelemetry(agentId) ?? store.getDefaultTelemetry();
}

export function getPermissions(agentId: string): Permissions {
  return store.getPermissions(agentId) ?? store.getDefaultPermissions();
}

export function getAuditItems(agentId?: string): AuditItem[] {
  return store.getAuditItems(agentId);
}

export function getActionLog(agentId: string): ActionLogEntry[] {
  return store.getActionLog(agentId);
}

export function getNextStep(agentId: string): string {
  return store.getNextStep(agentId);
}

export function getAgentWorkspace(agentId: string): string | null {
  for (const project of projects) {
    if (project.agents.some(a => a.id === agentId)) {
      return project.workspaceId;
    }
  }
  return null;
}

export function nameToAgentId(name: string): string | null {
  const lower = name.toLowerCase();
  return agents.find(a => a.name.toLowerCase() === lower)?.id ?? null;
}

export function approveAudit(id: string): void {
  store.approveAudit(id);
}

export function denyAudit(id: string): void {
  store.denyAudit(id);
}

export { type Agent, type Telemetry, type Permissions, type AuditItem, type ActionLogEntry };