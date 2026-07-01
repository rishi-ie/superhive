/**
 * Chat store — owns chat threads + messages.
 *
 * Delegates to ChatRepository, which wraps DataSource.chat.
 */
import { getDataSource } from '@/data/datasource/index';
import { ChatRepository } from './repository';
import type { ChatThread, Message, ChatQuickStartItem } from './interface';

const repo = new ChatRepository(getDataSource());

export function listThreads(): ChatThread[] {
  return repo.listThreads();
}

export function getThreadByAgent(agentId: string): ChatThread | undefined {
  return repo.getByAgent(agentId);
}

export function getCurrentThread(agentId?: string): ChatThread | undefined {
  return repo.getCurrent(agentId);
}

export function addMessageToActiveThread(content: string, agentId?: string): void {
  const thread = agentId ? (repo.getByAgent(agentId) ?? repo.getCurrent()) : repo.getCurrent();
  if (thread) repo.addMessage(thread.id, content, 'user');
}

export function addAssistantMessage(threadId: string, content: string): Message {
  return repo.addMessage(threadId, content, 'assistant');
}

export function updateMessage(messageId: string, patch: Partial<Omit<Message, 'id' | 'role'>>): void {
  void messageId;
  void patch;
}

export function setMessageFeedback(messageId: string, feedback: Message['feedback']): void {
  repo.setFeedback(messageId, feedback);
}

export function createThreadForAgent(agentId: string, title: string): ChatThread {
  return repo.createThread(agentId, title);
}

export function listChatQuickStart(): ChatQuickStartItem[] {
  return repo.listQuickStart();
}

export { type ChatThread, type Message };
