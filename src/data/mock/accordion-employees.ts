import type { AgentStatus } from '@/types/agent';

export type AccordionAgent = {
  id: string;
  name: string;
  status: AgentStatus;
  currentTask?: string;
};

export const accordionAgents: AccordionAgent[] = [
  { id: 'ava',    name: 'Ava Chen',      status: 'EXECUTING',     currentTask: 'Writing onboarding flow' },
  { id: 'marcus', name: 'Marcus Webb',   status: 'COMPILING',     currentTask: 'Reviewing PR #142' },
  { id: 'priya',  name: 'Priya Sharma',  status: 'ERROR_LOOP',    currentTask: 'API integration stalled' },
  { id: 'sonia',  name: 'Sonia Patel',   status: 'AWAITING_HUMAN', currentTask: 'Building design system' },
];