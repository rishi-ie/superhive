import { isMockEnabled } from '@/lib/feature-flags';
import mockData from '../mock.json';
import type { MockData } from '../mock-types';
import type { ChatThread, Message } from './interface';

const data = mockData as MockData;

const mockThreads: ChatThread[] = data.chatThreads.map(thread => ({
  id: thread.id,
  title: thread.title,
  messages: thread.messages.map(msg => ({
    ...msg,
    timestamp: new Date(Date.now() - msg.minutesAgo * 60 * 1000),
  })) as Message[],
  updatedAt: new Date(Date.now() - thread.updatedAtMinutesAgo * 60 * 1000),
}));

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
