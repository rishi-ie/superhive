/**
 * Agent manager — renderer-side stub for spawning agents.
 *
 * Phase 37 (general-v1) is MANUAL. This module is the in-app stub that
 * gets called when a workspace/project is created. It records the intent
 * in `agent_processes` so future spawned agents can be tracked. Real
 * subprocess spawning lands when general-v1 ships.
 */
import { registerAgentProcess, setAgentProcessStatus } from '@/data/agent_process/store';
import { generateAgentId } from '@/functions/agents';

const STUB_STATUS = 'STUB';

export type AgentKind = 'workspace' | 'project';

/**
 * Record a stub agent process for a newly created workspace or project.
 * Returns the generated ULID — useful for tracking/display.
 */
export function spawnAgentStub(opts: { kind: AgentKind; entityId: string; name: string }): string {
  const ulid = generateAgentId();
  registerAgentProcess(
    ulid,
    0,
    opts.kind === 'workspace' ? opts.entityId : undefined,
    opts.kind === 'project' ? opts.entityId : undefined,
  );
  setAgentProcessStatus(ulid, STUB_STATUS);
  return ulid;
}