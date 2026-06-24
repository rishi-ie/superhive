import type { Workspace } from './workspaces/interface';
import type { Project } from './projects/interface';
import type { UniversalTicket } from './tickets/interface';
import type { Agent, Telemetry, Permissions, AuditItem, ActionLogEntry } from './agents/interface';

export type IconKey = 'user' | 'folder';

export type FavoriteSeed = {
  id: string;
  type: 'project' | 'agent';
};

export type ChatMessageSeed = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  minutesAgo: number;
};

export type ChatThreadSeed = {
  id: string;
  title: string;
  messages: ChatMessageSeed[];
  updatedAtMinutesAgo: number;
};

export type ChannelMessageSeed = {
  id: string;
  channelId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isAI: boolean;
};

export type MockData = {
  workspaces: Workspace[];
  currentWorkspaceId: string;
  projects: Record<string, Project>;
  universalTickets: UniversalTicket[];
  agents: Agent[];
  telemetry: Record<string, Telemetry>;
  permissions: Record<string, Permissions>;
  actionLogs: Record<string, ActionLogEntry[]>;
  nextSteps: Record<string, string>;
  auditItems: AuditItem[];
  chatThreads: ChatThreadSeed[];
  favorites: FavoriteSeed[];
  channelMessages: ChannelMessageSeed[];
};
