import type { AccordionAgent } from './interface';

interface LeftNavApi {
  listAccordionAgents(): Promise<AccordionAgent[]>;
}

export const leftNavApi: LeftNavApi = {
  listAccordionAgents() {
    throw new Error('Not implemented — replace with real API call');
  },
};
