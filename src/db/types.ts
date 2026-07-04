export interface ReasoningStep {
  label: string;
  description?: string;
  status: 'complete' | 'active' | 'pending';
}

export interface ToolCall {
  name: string;
  target?: string;
}

export interface Attachment {
  name: string;
  type: string;
}

export interface Agent {
  id: string;
  name: string;
  description?: string | null;
  iconName?: string | null;
  model?: string | null;
  createdAt?: Date | null;
}

export type AgentInput = Omit<Agent, 'id' | 'createdAt'>;

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  iconName?: string | null;
  createdAt?: Date | null;
}

export type ProjectInput = Omit<Project, 'id' | 'createdAt'>;

export type SessionCategory = 'agent' | 'project' | 'hive' | 'remote';

export interface Session {
  id: string;
  category: SessionCategory;
  itemId: string;
  title: string;
  createdAt?: Date | null;
}

export type SessionInput = Omit<Session, 'id' | 'createdAt'>;

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  reasoning?: ReasoningStep[];
  toolCalls?: ToolCall[];
  attachments?: Attachment[];
  createdAt?: Date | null;
}

export type MessageInput = Omit<Message, 'id' | 'createdAt'>;
