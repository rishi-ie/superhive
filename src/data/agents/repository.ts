/**
 * Agents repository — wrapper over DataSource.agents + telemetry/permissions/audit
 * collections. Provides a coherent domain API.
 */
import type { DataSource } from '@/data/datasource/types';
import type {
  Agent,
  Telemetry,
  Permissions,
  AuditItem,
  ActionLogEntry,
  PendingQuestion,
} from './interface';

export class AgentsRepository {
  constructor(private ds: DataSource) {}

  list(): Agent[] {
    return this.ds.agents.findAll();
  }

  byId(id: string): Agent | undefined {
    return this.ds.agents.findById(id);
  }

  patch(id: string, partial: { name?: string; role?: string; principles?: string; boundaries?: string; skills?: string[] }): Agent | undefined {
    return this.ds.agents.update(id, partial as Partial<Agent>);
  }

  getTelemetry(agentId: string): Telemetry | null {
    const rec = this.ds.telemetry.findByAgentId(agentId);
    if (rec) {
      return {
        contextSaturation: rec.contextSaturation,
        tokensPerSecond: rec.tokensPerSecond,
        currentCost: rec.currentCost,
        evolutionLoop: rec.evolutionLoop,
        logicKernelIntegrity: rec.logicKernelIntegrity,
        sessionCost: rec.sessionCost,
        budget: rec.budget,
      };
    }
    return this.ds.telemetry.findAll()[0] ?? null;
  }

  getPermissions(agentId: string): Permissions | null {
    const rec = this.ds.permissions.findByAgentId(agentId);
    if (rec) {
      return {
        modelEngine: rec.modelEngine,
        writeAccess: rec.writeAccess,
        commitAuthority: rec.commitAuthority as Permissions['commitAuthority'],
        maxTokens: rec.maxTokens,
        writeMessages: rec.writeMessages,
        installDeps: rec.installDeps,
      };
    }
    return null;
  }

  getAuditItems(agentId?: string): AuditItem[] {
    return this.ds.auditItems.findAll().filter(
      (item) => !agentId || item.agentId === agentId,
    );
  }

  approveAudit(id: string): void {
    this.ds.auditItems.delete(id);
  }

  denyAudit(id: string): void {
    this.ds.auditItems.delete(id);
  }

  getPendingQuestions(agentId: string): PendingQuestion[] {
    return this.ds.pendingQuestions.findAll().filter((q) => q.agentId === agentId);
  }

  answerQuestion(id: string): void {
    this.ds.pendingQuestions.delete(id);
  }

  getActionLog(agentId: string): ActionLogEntry[] {
    return this.ds.actionLogs.findByAgentId(agentId).map((r) => ({
      time: r.time,
      action: r.action,
    }));
  }

  getNextStep(agentId: string): string {
    return this.ds.nextSteps.findByAgentId(agentId)?.step ?? 'Next — Standing by';
  }
}

export function createAgentsRepository(ds: DataSource): AgentsRepository {
  return new AgentsRepository(ds);
}
