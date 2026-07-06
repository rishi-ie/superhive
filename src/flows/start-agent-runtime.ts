import { agents } from '@/api/agents';

export async function startAgentRuntime(agentId: string): Promise<void> {
  await agents.start(agentId);
}