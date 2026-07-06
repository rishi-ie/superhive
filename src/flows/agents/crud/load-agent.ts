import { agents } from '@/api/agents';
import type { Agent } from '@/types/electron';

export async function loadAgent(id: string): Promise<Agent | null> {
  return agents.get(id);
}