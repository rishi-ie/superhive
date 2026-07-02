/**
 * Agents store — owns agent data + telemetry/permissions/audit state.
 *
 * Delegates to AgentsRepository, which wraps DataSource collections.
 */
import { getDataSource } from '@/data/datasource/index';
import { AgentsRepository } from './repository';
import type { Agent, Telemetry, Permissions, AuditItem, ActionLogEntry, PendingQuestion } from './interface';

const repo = new AgentsRepository(getDataSource());

export function listAgents(): Agent[] {
  return repo.list();
}

export function getAgent(id: string): Agent | undefined {
  return repo.byId(id);
}

export function patchAgent(
  id: string,
  patch: { name?: string; role?: string; principles?: string; boundaries?: string; skills?: string[] },
): Agent | undefined {
  return repo.patch(id, patch);
}

export function getActiveAgent(preferredId?: string | null): Agent | null {
  const agents = repo.list();
  if (preferredId) {
    return agents.find((a) => a.id === preferredId) ?? agents[0] ?? null;
  }
  return (
    agents.find((a) => a.status === 'EXECUTING') ??
    agents.find((a) => a.status === 'COMPILING') ??
    agents[0] ??
    null
  );
}

export function getTelemetry(agentId: string): Telemetry {
  return repo.getTelemetry(agentId) ?? getDefaultTelemetry();
}

export function getPermissions(agentId: string): Permissions {
  return repo.getPermissions(agentId) ?? getDefaultPermissions();
}

export function setPermissions(agentId: string, permissions: Permissions): void {
  const ds = getDataSource();
  ds.permissions.upsert(agentId, { agentId, ...permissions });
}

export function getAuditItems(agentId?: string): AuditItem[] {
  return repo.getAuditItems(agentId);
}

export function approveAudit(id: string): void {
  repo.approveAudit(id);
}

export function denyAudit(id: string): void {
  repo.denyAudit(id);
}

export function getActionLog(agentId: string): ActionLogEntry[] {
  return repo.getActionLog(agentId);
}

export function getNextStep(agentId: string): string {
  return repo.getNextStep(agentId);
}

export function getPendingQuestions(agentId: string): PendingQuestion[] {
  return repo.getPendingQuestions(agentId);
}

export function answerQuestion(id: string, _answer: string, agentId: string): void {
  repo.answerQuestion(id);
  void _answer;
  void agentId;
}

export function nameToAgentId(name: string): string | null {
  return repo.list().find((a) => a.name.toLowerCase() === name.toLowerCase())?.id ?? null;
}

export function getAgentWorkspace(agentId: string): string | null {
  const ds = getDataSource();
  for (const project of ds.projects.findAll()) {
    if (project.agents.some((a) => a.id === agentId)) {
      return project.workspaceId;
    }
  }
  return null;
}

export function getDefaultTelemetry(): Telemetry {
  const ds = getDataSource();
  const defaults = ds.telemetry.findAll()[0];
  if (defaults) {
    return {
      contextSaturation: defaults.contextSaturation,
      tokensPerSecond: defaults.tokensPerSecond,
      currentCost: defaults.currentCost,
      evolutionLoop: defaults.evolutionLoop,
      logicKernelIntegrity: defaults.logicKernelIntegrity,
      sessionCost: defaults.sessionCost,
      budget: defaults.budget,
    };
  }
  return { contextSaturation: 50, tokensPerSecond: 0, currentCost: 0, evolutionLoop: '0/100', logicKernelIntegrity: 100, sessionCost: 0, budget: 5 };
}

export function getDefaultPermissions(): Permissions {
  const ds = getDataSource();
  const defaults = ds.permissions.findAll()[0];
  if (defaults) {
    return {
      modelEngine: defaults.modelEngine,
      writeAccess: defaults.writeAccess,
      commitAuthority: defaults.commitAuthority as Permissions['commitAuthority'],
      maxTokens: defaults.maxTokens,
      writeMessages: defaults.writeMessages,
      installDeps: defaults.installDeps,
    };
  }
  return { modelEngine: 'Opus 4.8', writeAccess: false, commitAuthority: 'REVIEW_ONLY', maxTokens: 8192, writeMessages: false, installDeps: false };
}

export { type Agent, type Telemetry, type Permissions, type AuditItem, type ActionLogEntry, type PendingQuestion };
