import type { AgentStatus } from '@/types/agent';

export type AccordionAgent = {
  id: string;
  name: string;
  status: AgentStatus;
  currentTask?: string;
};
