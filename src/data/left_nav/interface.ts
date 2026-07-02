import type { AgentStatus } from '@/data/agent/interface';

export type AccordionAgent = {
  id: string;
  name: string;
  status: AgentStatus;
  currentTask?: string;
};
