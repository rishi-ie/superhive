export type TicketStatus = 'TODO' | 'EXECUTING' | 'DONE';

export type Ticket = {
  id: string;
  title: string;
  status: TicketStatus;
  assignedAgentId: string;
};

export type AgentCurrentStatus = 'WORKING' | 'COMPILING' | 'IDLE';

export type ProjectAgent = {
  id: string;
  name: string;
  role: string;
  currentStatus: AgentCurrentStatus;
  assignedTicketId: string | null;
  initials: string;
};

export type SwarmActivity = {
  id: string;
  timestamp: string;
  primaryAgent: string;
  action: string;
  targetAgent: string;
  context: string;
};

export type ChannelStatus = 'OPEN' | 'AWAITING_REPLY' | 'RESOLVED';

export type CommunicationChannel = {
  id: string;
  participants: string[];
  topic: string;
  relatedTicketId: string;
  status: ChannelStatus;
  lastMessagePreview: string;
  messageCount: number;
  updatedAt: string;
  unread?: boolean;
  workspaceId?: string;
};

export type ProjectStatus = 'ACTIVE' | 'ARCHIVED';

export type Project = {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  successCriteria: string;
  color: string;
  status: ProjectStatus;
  tickets: Ticket[];
  agents: ProjectAgent[];
  channels: CommunicationChannel[];
  activity: SwarmActivity[];
};

export type CreateProjectInput = {
  title: string;
  workspaceId: string;
  description?: string;
  successCriteria?: string;
  color?: string;
  agentIds?: string[];
};

export type ChannelMessage = {
  id: string;
  channelId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isAI: boolean;
};