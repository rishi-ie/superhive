import type { Agent, AgentStatus } from '@/storage/types';

export const agents = {
  list: (): Promise<Agent[]> => window.api.agents.list(),

  get: (id: string): Promise<Agent | null> => window.api.agents.get(id),

  create: (data: {
    name: string;
    role?: string;
    status?: AgentStatus;
  }): Promise<Agent> => window.api.agents.create(data),
};
