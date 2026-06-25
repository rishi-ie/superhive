import { isMockEnabled } from '@/data/mock/feature-flags';
import mockData from '../mock.json';
import type { MockData } from '../mock/types';
import type { ChatThread, Message } from './interface';

const data = mockData as MockData;

let mockThreads: ChatThread[] = data.chatThreads.map(thread => ({
  id: thread.id,
  title: thread.title,
  agentId: thread.agentId,
  messages: thread.messages.map(msg => ({
    ...msg,
    timestamp: new Date(Date.now() - msg.minutesAgo * 60 * 1000),
    status: 'sent' as const,
  })) as Message[],
  updatedAt: new Date(Date.now() - thread.updatedAtMinutesAgo * 60 * 1000),
}));

interface ChatStore {
  list(): ChatThread[];
  getByAgent(agentId: string): ChatThread | undefined;
  getCurrent(agentId?: string): ChatThread | undefined;
  addMessage(threadId: string, content: string, role?: 'user' | 'assistant'): Message;
  updateMessage(messageId: string, patch: Partial<Omit<Message, 'id' | 'role'>>): void;
  setFeedback(messageId: string, feedback: Message['feedback']): void;
  createThread(agentId: string, title: string): ChatThread;
}

const emptyStore: ChatStore = {
  list() { return []; },
  getByAgent() { return undefined; },
  getCurrent() { return undefined; },
  addMessage() { throw new Error('No chat store'); },
  updateMessage() {},
  setFeedback() {},
  createThread() { throw new Error('No chat store'); },
};

const mockStore: ChatStore = {
  list() { return mockThreads; },

  getByAgent(agentId: string) {
    return mockThreads.find(t => t.agentId === agentId);
  },

  getCurrent(agentId?: string) {
    if (agentId) {
      return mockThreads.find(t => t.agentId === agentId) ?? mockThreads[0];
    }
    return mockThreads[0];
  },

  addMessage(threadId: string, content: string, role: 'user' | 'assistant' = 'user') {
    const thread = mockThreads.find(t => t.id === threadId) ?? mockThreads[0];
    if (!thread) return { id: '', role: 'user' as const, content, timestamp: new Date(), status: 'error' as const };
    const msg: Message = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date(),
      status: 'sent',
    };
    thread.messages.push(msg);
    thread.updatedAt = new Date();
    return msg;
  },

  updateMessage(messageId: string, patch) {
    for (const thread of mockThreads) {
      const msg = thread.messages.find(m => m.id === messageId);
      if (msg) {
        Object.assign(msg, patch);
        return;
      }
    }
  },

  setFeedback(messageId: string, feedback) {
    for (const thread of mockThreads) {
      const msg = thread.messages.find(m => m.id === messageId);
      if (msg) {
        msg.feedback = feedback;
        return;
      }
    }
  },

  createThread(agentId: string, title: string) {
    const thread: ChatThread = {
      id: `thread-${agentId}-${Date.now()}`,
      title,
      agentId,
      messages: [],
      updatedAt: new Date(),
    };
    mockThreads.unshift(thread);
    return thread;
  },
};

const store: ChatStore = isMockEnabled('chat') ? mockStore : emptyStore;

export function listThreads(): ChatThread[] {
  return store.list();
}

export function getThreadByAgent(agentId: string): ChatThread | undefined {
  return store.getByAgent(agentId);
}

export function getCurrentThread(agentId?: string): ChatThread | undefined {
  return store.getCurrent(agentId);
}

export function addMessageToActiveThread(content: string, agentId?: string): void {
  const thread = agentId
    ? (store.getByAgent(agentId) ?? store.getCurrent())
    : store.getCurrent();
  if (thread) store.addMessage(thread.id, content, 'user');
}

export function addAssistantMessage(threadId: string, content: string): Message {
  return store.addMessage(threadId, content, 'assistant');
}

export function updateMessage(messageId: string, patch: Partial<Omit<Message, 'id' | 'role'>>): void {
  store.updateMessage(messageId, patch);
}

export function setMessageFeedback(messageId: string, feedback: Message['feedback']): void {
  store.setFeedback(messageId, feedback);
}

export function createThreadForAgent(agentId: string, title: string): ChatThread {
  return store.createThread(agentId, title);
}

export type { ChatThread };
export type { Message };
