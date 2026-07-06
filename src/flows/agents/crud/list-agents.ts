import { agents } from '@/api/agents';
import type { Agent } from '@/types/electron';

export async function listAgents(): Promise<Agent[]> {
  return agents.list();
}