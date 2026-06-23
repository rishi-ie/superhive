import type { AgentStatus } from '@/data/agents/interface';

export type AccordionAgent = {
  id: string;
  name: string;
  status: AgentStatus;
  currentTask?: string;
};
