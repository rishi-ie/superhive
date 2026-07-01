import type { Workspace } from '@/data/workspaces/interface';
import type { Project } from '@/data/projects/interface';
import type { UniversalTicket } from '@/data/tickets/interface';
import type { Agent, Telemetry, Permissions, AuditItem, ActionLogEntry, PendingQuestion } from '@/data/agents/interface';
import type { Theme } from '@/data/settings/interface';
import type { ActivityEvent } from '@/data/activity/interface';

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
  model?: string;
  tokenCount?: number;
  durationMs?: number;
};

export type ChatThreadSeed = {
  id: string;
  title: string;
  agentId?: string;
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

export type CostUsageEntry = {
  date: string;
  cost: number;
};

export type ChatQuickStartItem = {
  icon: string;
  label: string;
  description: string;
  category: string;
};

export type MockData = {
  workspaces: Workspace[];
  currentWorkspaceId: string;
  projects: Project[];
  universalTickets: UniversalTicket[];
  agents: Agent[];
  telemetry: Record<string, Telemetry>;
  permissions: Record<string, Permissions>;
  actionLogs: Record<string, ActionLogEntry[]>;
  nextSteps: Record<string, string>;
  auditItems: AuditItem[];
  pendingQuestions: PendingQuestion[];
  chatThreads: ChatThreadSeed[];
  favorites: FavoriteSeed[];
  channelMessages: ChannelMessageSeed[];
  costUsage: CostUsageEntry[];
  chatQuickStart: ChatQuickStartItem[];
  customThemes: Theme[];
  homeActivityEvents: ActivityEvent[];
};
