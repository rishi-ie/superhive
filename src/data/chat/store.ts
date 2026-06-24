import { isMockEnabled } from '@/lib/feature-flags';
import mockData from '../mock.json';
import type { MockData } from '../mock-types';
import type { ChatThread, Message } from './interface';

const data = mockData as MockData;

let mockThreads: ChatThread[] = data.chatThreads.map(thread => ({
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
  addMessage(threadId: string, content: string): void;
}

const emptyStore: ChatStore = {
  list() { return []; },
  getCurrent() { return undefined; },
  addMessage() {},
};

const mockStore: ChatStore = {
  list() { return mockThreads; },
  getCurrent() { return mockThreads[0]; },
  addMessage(threadId: string, content: string) {
    const thread = mockThreads.find(t => t.id === threadId);
    if (!thread) return;
    thread.messages.push({
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    });
    thread.updatedAt = new Date();
  },
};

const store: ChatStore = isMockEnabled('chat') ? mockStore : emptyStore;

export function listThreads(): ChatThread[] {
  return store.list();
}

export function getCurrentThread(): ChatThread | undefined {
  return store.getCurrent();
}

export function addMessageToActiveThread(content: string): void {
  const thread = store.getCurrent();
  if (thread) {
    store.addMessage(thread.id, content);
  }
}

export type { ChatThread };
export type { Message };
