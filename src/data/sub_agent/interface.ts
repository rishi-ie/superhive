/**
 * sub_agents — agent subprocess registry.
 *
 * Tracks sub-agents spawned by parent agents: name, kind, status, task.
 * Used for the sub-agent spawn UI in Phase 54-55.
 */
export type SubAgentKind = 'scout' | 'researcher' | 'planner' | 'worker' | 'reviewer' | 'oracle' | 'delegate' | 'context-builder' | string;

export type SubAgent = {
  id: string;
  parentUlid: string;
  name: string;
  kind: SubAgentKind;
  status: 'STARTING' | 'RUNNING' | 'IDLE' | 'ERROR_LOOP' | 'FINISHED' | 'TERMINATED';
  startedAt: string;
  finishedAt: string | null;
  task: string | null;
};
