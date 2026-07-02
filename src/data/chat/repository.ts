/**
 * Chat repository — wrapper over DataSource.chat.
 * Owns thread + message CRUD and quick-start data.
 */
import type { DataSource } from '@/data/datasource/types';
import type { ChatThread, Message, ChatQuickStartItem } from './interface';

export class ChatRepository {
  constructor(private ds: DataSource) {}

  listThreads(): ChatThread[] {
    return this.ds.chat.findAll();
  }

  getById(id: string): ChatThread | undefined {
    return this.ds.chat.findById(id);
  }

  listThreadsByScope(opts: { projectId?: string; workspaceId?: string; kind?: string }): ChatThread[] {
    return this.listThreads().filter((t) => {
      if (opts.kind && t.threadKind !== opts.kind) return false;
      if (opts.projectId && t.projectId !== opts.projectId) return false;
      if (opts.workspaceId && t.workspaceId !== opts.workspaceId) return false;
      return true;
    });
  }

  getByAgent(agentId: string): ChatThread | undefined {
    return this.listThreads().find((t) => t.agentId === agentId);
  }

  getByProject(projectId: string): ChatThread | undefined {
    return this.listThreads().find((t) => t.projectId === projectId && t.threadKind === 'project-agent');
  }

  getByWorkspace(workspaceId: string): ChatThread | undefined {
    return this.listThreads().find((t) => t.workspaceId === workspaceId && t.threadKind === 'workspace-agent');
  }

  getCurrent(agentId?: string): ChatThread | undefined {
    if (agentId) return this.getByAgent(agentId) ?? this.listThreads()[0];
    return this.listThreads()[0];
  }

  addMessage(threadId: string, content: string, role: 'user' | 'assistant' = 'user'): Message {
    const thread = this.ds.chat.findById(threadId) ?? this.listThreads()[0];
    if (!thread) {
      return {
        id: '',
        role: 'user',
        content,
        timestamp: new Date(),
        status: 'error',
      };
    }
    const msg: Message = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date(),
      status: 'sent',
    };
    const updated = { ...thread, messages: [...thread.messages, msg] };
    this.ds.chat.update(threadId, updated as Partial<ChatThread>);
    return msg;
  }

  setFeedback(messageId: string, feedback: Message['feedback']): void {
    for (const thread of this.listThreads()) {
      const msg = thread.messages.find((m) => m.id === messageId);
      if (msg) {
        const updated = {
          ...thread,
          messages: thread.messages.map((m) =>
            m.id === messageId ? { ...m, feedback } : m,
          ),
        };
        this.ds.chat.update(thread.id, updated as Partial<ChatThread>);
        return;
      }
    }
  }

  createThread(agentId: string, title: string): ChatThread {
    return this.ds.chat.create({ id: `thread-${agentId}-${Date.now()}`, title, agentId, messages: [], updatedAt: new Date(), threadKind: 'agent' });
  }

  createThreadForProject(projectId: string, title: string): ChatThread {
    return this.ds.chat.create({ id: `thread-project-${projectId}-${Date.now()}`, title, projectId, workspaceId: null, messages: [], updatedAt: new Date(), threadKind: 'project-agent' });
  }

  createThreadForWorkspace(workspaceId: string, title: string): ChatThread {
    return this.ds.chat.create({ id: `thread-workspace-${workspaceId}-${Date.now()}`, title, workspaceId, messages: [], updatedAt: new Date(), threadKind: 'workspace-agent' });
  }

  listQuickStart(): ChatQuickStartItem[] {
    return this.ds.chatQuickStart.findAll();
  }
}

export function createChatRepository(ds: DataSource): ChatRepository {
  return new ChatRepository(ds);
}
