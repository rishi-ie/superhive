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

export function getThread(id: string): ChatThread | undefined {
  return repo.getById(id);
}

export function listThreadsByScope(opts: { projectId?: string; workspaceId?: string; kind?: string }): ChatThread[] {
  return repo.listThreadsByScope(opts);
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

export function getThreadByProject(projectId: string): ChatThread | undefined {
  return repo.getByProject(projectId);
}

export function getThreadByWorkspace(workspaceId: string): ChatThread | undefined {
  return repo.getByWorkspace(workspaceId);
}

export function createThreadForProject(projectId: string, title: string): ChatThread {
  return repo.createThreadForProject(projectId, title);
}

export function createThreadForWorkspace(workspaceId: string, title: string): ChatThread {
  return repo.createThreadForWorkspace(workspaceId, title);
}

export function listChatQuickStart(): ChatQuickStartItem[] {
  return repo.listQuickStart();
}

export { type ChatThread, type Message };
