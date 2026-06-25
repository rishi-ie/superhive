import { isMockEnabled } from '@/data/mock/feature-flags';
import mockData from '../mock.json';
import type { MockData } from '../mock/types';
import type { AgentStore, Agent, Telemetry, Permissions, AuditItem, ActionLogEntry } from './interface';
import type { Project } from '@/data/projects/store';

const data = mockData as MockData;

const agents: Agent[] = data.agents as Agent[];
const projectsByWorkspace: Record<string, Project> = data.projects;
const telemetryMap: Record<string, Telemetry> = data.telemetry as Record<string, Telemetry>;
const permissionsMap: Record<string, Permissions> = data.permissions as Record<string, Permissions>;
const actionLogMap: Record<string, ActionLogEntry[]> = data.actionLogs as Record<string, ActionLogEntry[]>;
const nextStepMap: Record<string, string> = data.nextSteps;

let auditItemsMutable: AuditItem[] = structuredClone(data.auditItems);

const DEFAULT_TELEMETRY: Telemetry = {
  contextSaturation: 50, tokensPerSecond: 0, currentCost: 0, evolutionLoop: '0/100', logicKernelIntegrity: 100, sessionCost: 0, budget: 5.00,
};

const DEFAULT_PERMISSIONS: Permissions = {
  modelEngine: 'Opus 4.8', writeAccess: false, commitAuthority: 'REVIEW_ONLY', maxTokens: 8192, writeMessages: false, installDeps: false,
};

const mockAgentStore: AgentStore = {
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

const emptyStore: AgentStore = {
  list() { return []; },
  get(_id) { return undefined; },
  getTelemetry() { return null; },
  getPermissions() { return null; },
  getAuditItems() { return []; },
  getActionLog() { return []; },
  getNextStep() { return ''; },
  getDefaultTelemetry() {
    return { contextSaturation: 0, tokensPerSecond: 0, currentCost: 0, evolutionLoop: '0/100', logicKernelIntegrity: 0, sessionCost: 0, budget: 0 };
  },
  getDefaultPermissions() {
    return { modelEngine: '—', writeAccess: false, commitAuthority: 'REVIEW_ONLY', maxTokens: 0, writeMessages: false, installDeps: false };
  },
  approveAudit() {},
  denyAudit() {},
};

const store: AgentStore = isMockEnabled('agents') ? mockAgentStore : emptyStore;

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
  for (const project of Object.values(projectsByWorkspace)) {
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
