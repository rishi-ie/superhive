import { mockableData } from '@/data/mock/index';
import type { ChatThread, Message } from './interface';

let mockThreads: ChatThread[] = (mockableData.chatThreads ?? []).map(thread => ({
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

function list(): ChatThread[] {
  return mockThreads;
}

function getByAgent(agentId: string): ChatThread | undefined {
  return mockThreads.find(t => t.agentId === agentId);
}

function getCurrent(agentId?: string): ChatThread | undefined {
  if (agentId) {
    return mockThreads.find(t => t.agentId === agentId) ?? mockThreads[0];
  }
  return mockThreads[0];
}

function addMessage(threadId: string, content: string, role: 'user' | 'assistant' = 'user'): Message {
  const thread = mockThreads.find(t => t.id === threadId) ?? mockThreads[0];
  if (!thread) {
    return { id: '', role: 'user' as const, content, timestamp: new Date(), status: 'error' as const };
  }
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
}

function updateMessageInternal(messageId: string, patch: Partial<Omit<Message, 'id' | 'role'>>): void {
  for (const thread of mockThreads) {
    const msg = thread.messages.find(m => m.id === messageId);
    if (msg) {
      Object.assign(msg, patch);
      return;
    }
  }
}

function setFeedback(messageId: string, feedback: Message['feedback']): void {
  for (const thread of mockThreads) {
    const msg = thread.messages.find(m => m.id === messageId);
    if (msg) {
      msg.feedback = feedback;
      return;
    }
  }
}

function createThread(agentId: string, title: string): ChatThread {
  const thread: ChatThread = {
    id: `thread-${agentId}-${Date.now()}`,
    title,
    agentId,
    messages: [],
    updatedAt: new Date(),
  };
  mockThreads.unshift(thread);
  return thread;
}

export function listThreads(): ChatThread[] {
  return list();
}

export function getThreadByAgent(agentId: string): ChatThread | undefined {
  return getByAgent(agentId);
}

export function getCurrentThread(agentId?: string): ChatThread | undefined {
  return getCurrent(agentId);
}

export function addMessageToActiveThread(content: string, agentId?: string): void {
  const thread = agentId
    ? (getByAgent(agentId) ?? getCurrent())
    : getCurrent();
  if (thread) addMessage(thread.id, content, 'user');
}

export function addAssistantMessage(threadId: string, content: string): Message {
  return addMessage(threadId, content, 'assistant');
}

export function updateMessage(messageId: string, patch: Partial<Omit<Message, 'id' | 'role'>>): void {
  updateMessageInternal(messageId, patch);
}

export function setMessageFeedback(messageId: string, feedback: Message['feedback']): void {
  setFeedback(messageId, feedback);
}

export function createThreadForAgent(agentId: string, title: string): ChatThread {
  return createThread(agentId, title);
}

export function listChatQuickStart(): typeof mockableData.chatQuickStart {
  return mockableData.chatQuickStart ?? [];
}

export type { ChatThread };
export type { Message };