export type MessageStatus = 'sending' | 'sent' | 'error';

export type MessageFeedback = 'up' | 'down' | null;

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status?: MessageStatus;
  model?: string;
  tokenCount?: number;
  durationMs?: number;
  feedback?: MessageFeedback;
  attachments?: { name: string; size: number; kind: 'file' | 'image' }[];
};

export type ChatThread = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: Date;
  agentId?: string;
};
