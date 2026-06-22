import type { AccordionAgent } from './interface';

const accordionAgents: AccordionAgent[] = [
  { id: 'ava',    name: 'Ava Chen',      status: 'EXECUTING',     currentTask: 'Writing onboarding flow' },
  { id: 'marcus', name: 'Marcus Webb',   status: 'COMPILING',     currentTask: 'Reviewing PR #142' },
  { id: 'priya',  name: 'Priya Sharma',  status: 'ERROR_LOOP',    currentTask: 'API integration stalled' },
  { id: 'sonia',  name: 'Sonia Patel',  status: 'AWAITING_HUMAN', currentTask: 'Building design system' },
];

export { accordionAgents };
