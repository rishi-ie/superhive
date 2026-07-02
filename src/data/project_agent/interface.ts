/**
 * project_agents — project roster / join table.
 *
 * Tracks which agents belong to which projects, with per-project role, status,
 * assigned ticket, and an optional path to the agent's project-scoped SAC context.
 */
export type ProjectAgent = {
  projectId: string;
  agentId: string;
  role: string | null;
  currentStatus: 'WORKING' | 'COMPILING' | 'IDLE' | 'AWAITING_HUMAN' | 'ERROR_LOOP';
  assignedTicketId: string | null;
  joinedAt: string;
  contextSnapshotPath: string | null;
};
