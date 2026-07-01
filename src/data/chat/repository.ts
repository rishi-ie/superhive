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

  getByAgent(agentId: string): ChatThread | undefined {
    return this.listThreads().find((t) => t.agentId === agentId);
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
    // Patch thread.messages via update — clone + push
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
    return this.ds.chat.create({ id: `thread-${agentId}-${Date.now()}`, title, agentId, messages: [], updatedAt: new Date() });
  }

  listQuickStart(): ChatQuickStartItem[] {
    return this.ds.chatQuickStart.findAll();
  }
}

export function createChatRepository(ds: DataSource): ChatRepository {
  return new ChatRepository(ds);
}
