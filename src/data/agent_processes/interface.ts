/**
 * agent_processes — agent subprocess registry.
 *
 * Tracks running agent subprocesses: ULID, pid, status, heartbeat, port, and workspace/project scope.
 */
export type AgentProcess = {
  ulid: string;
  pid: number | null;
  status: 'STARTING' | 'RUNNING' | 'IDLE' | 'ERROR_LOOP' | 'TERMINATED';
  lastHeartbeatAt: string | null;
  startedAt: string;
  port: number | null;
  workspaceId: string | null;
  projectId: string | null;
};
