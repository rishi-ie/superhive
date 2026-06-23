import { isMockEnabled } from '@/lib/feature-flags';
import mockData from '../mock.json';
import type { MockData } from '../mock-types';
import type { AccordionAgent } from './interface';

const data = mockData as MockData;
const accordionAgents: AccordionAgent[] = data.accordionAgents;

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
