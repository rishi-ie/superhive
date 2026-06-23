import type { Workspace } from './workspaces/interface';
import type { Project } from './projects/interface';
import type { UniversalTicket } from './tickets/interface';
import type { Employee, Telemetry, Permissions, AuditItem, ActionLogEntry } from './employees/interface';
import type { ChatThread } from './chat/interface';
import type { AccordionAgent } from './left-nav/interface';

export type IconKey = 'user' | 'folder';

export type FavoriteSeed = {
  id: string;
  label: string;
  type: 'project' | 'employee';
  iconKey: IconKey;
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

export type MockData = {
  workspaces: Workspace[];
  currentWorkspaceId: string;
  projects: Record<string, Project>;
  universalTickets: UniversalTicket[];
  employees: Employee[];
  telemetry: Record<string, Telemetry>;
  permissions: Record<string, Permissions>;
  actionLogs: Record<string, ActionLogEntry[]>;
  nextSteps: Record<string, string>;
  auditItems: AuditItem[];
  chatThreads: ChatThreadSeed[];
  favorites: FavoriteSeed[];
  accordionAgents: AccordionAgent[];
};
