import { isMockEnabled } from '@/lib/feature-flags';
import { mockThreads } from './mock';
import type { ChatThread, Message } from './interface';

interface ChatStore {
  list(): ChatThread[];
  getCurrent(): ChatThread | undefined;
}

const emptyStore: ChatStore = {
  list() { return []; },
  getCurrent() { return undefined; },
};

const mockStore: ChatStore = {
  list() { return mockThreads; },
  getCurrent() { return mockThreads[0]; },
};

const store: ChatStore = isMockEnabled('chat') ? mockStore : emptyStore;

export function listThreads(): ChatThread[] {
  return store.list();
}

export function getCurrentThread(): ChatThread | undefined {
  return store.getCurrent();
}

export type { ChatThread };
export type { Message };
