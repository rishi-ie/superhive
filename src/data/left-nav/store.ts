import { isMockEnabled } from '@/lib/feature-flags';
import { accordionAgents } from './mock';
import type { AccordionAgent } from './interface';

interface LeftNavStore {
  listAccordionAgents(): AccordionAgent[];
}

const emptyStore: LeftNavStore = {
  listAccordionAgents() { return []; },
};

const mockStore: LeftNavStore = {
  listAccordionAgents() { return accordionAgents; },
};

const store: LeftNavStore = isMockEnabled('left-nav') ? mockStore : emptyStore;

export function listAccordionAgents(): AccordionAgent[] {
  return store.listAccordionAgents();
}

export type { AccordionAgent };
