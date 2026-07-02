export type UniversalTicketStatus = 'BACKLOG' | 'EXECUTING' | 'REVIEW' | 'MERGED';
export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
export type TicketType = 'BUG' | 'FEATURE' | 'REFACTOR' | 'INFRA';

export type Assignee = {
  name: string;
  avatarUrl?: string;
  isAI: boolean;
};

export type UniversalTicket = {
  id: string;
  title: string;
  projectName: string;
  workspaceId: string;
  status: UniversalTicketStatus;
  priority: Priority;
  type: TicketType;
  assignee: Assignee;
  archivedAt?: string | null;
};
