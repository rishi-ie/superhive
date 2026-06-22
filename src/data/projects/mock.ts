import type {
  Ticket,
  ProjectAgent,
  SwarmActivity,
  CommunicationChannel,
} from './interface';

export const projectTitle = 'Superhive App';

export const tickets: Ticket[] = [
  { id: 'SH-142', title: 'Fix Auth Regression',        status: 'TODO',      assignedAgentId: 'ava' },
  { id: 'SH-143', title: 'Implement Onboarding Flow',   status: 'TODO',      assignedAgentId: 'sonia' },
  { id: 'SH-144', title: 'Add Dark Mode to Settings',   status: 'TODO',      assignedAgentId: 'james' },
  { id: 'SH-145', title: 'Refactor API Gateway',        status: 'EXECUTING', assignedAgentId: 'marcus' },
  { id: 'SH-146', title: 'Optimize Database Queries',   status: 'EXECUTING', assignedAgentId: 'priya' },
  { id: 'SH-140', title: 'Update Dependencies',         status: 'DONE',      assignedAgentId: 'ava' },
  { id: 'SH-141', title: 'Fix Login Bug',              status: 'DONE',      assignedAgentId: 'sonia' },
  { id: 'SH-139', title: 'Migrate to TypeScript Strict', status: 'DONE',    assignedAgentId: 'james' },
];

export const projectAgents: ProjectAgent[] = [
  { id: 'ava',    name: 'Ava Chen',     role: 'Frontend Engineer',   currentStatus: 'WORKING',   assignedTicketId: 'SH-145', initials: 'AC' },
  { id: 'marcus', name: 'Marcus Webb',  role: 'API Engineer',        currentStatus: 'COMPILING', assignedTicketId: 'SH-145', initials: 'MW' },
  { id: 'priya',  name: 'Priya Sharma', role: 'Database Engineer',   currentStatus: 'WORKING',   assignedTicketId: 'SH-146', initials: 'PS' },
  { id: 'sonia',  name: 'Sonia Patel', role: 'Design Engineer',     currentStatus: 'COMPILING', assignedTicketId: 'SH-143', initials: 'SP' },
  { id: 'james',  name: 'James Liu',   role: 'DevOps Engineer',     currentStatus: 'IDLE',      assignedTicketId: null,     initials: 'JL' },
];

export const swarmActivity: SwarmActivity[] = [
  { id: 'act-1', timestamp: '10:42 AM', primaryAgent: 'Marcus Webb',  action: 'requested schema validation from', targetAgent: 'Ava Chen',    context: 'for SH-145' },
  { id: 'act-2', timestamp: '10:38 AM', primaryAgent: 'Priya Sharma', action: 'shared database snapshot with',    targetAgent: 'Marcus Webb', context: 'for SH-146' },
  { id: 'act-3', timestamp: '10:31 AM', primaryAgent: 'Sonia Patel', action: 'handed off design tokens to',      targetAgent: 'Ava Chen',    context: 'for SH-143' },
  { id: 'act-4', timestamp: '10:24 AM', primaryAgent: 'Ava Chen',    action: 'requested code review from',       targetAgent: 'James Liu',   context: 'for SH-140' },
  { id: 'act-5', timestamp: '10:15 AM', primaryAgent: 'Marcus Webb',  action: 'requested deployment pipeline from', targetAgent: 'James Liu',  context: 'for SH-141' },
  { id: 'act-6', timestamp: '10:02 AM', primaryAgent: 'Priya Sharma', action: 'escalated timeout issue to',      targetAgent: 'Ava Chen',    context: 'for SH-142' },
];

export const channels: CommunicationChannel[] = [
  { id: 'ch-1', participants: ['Marcus Webb', 'Ava Chen'],     topic: 'Schema validation',   relatedTicketId: 'SH-145', status: 'OPEN',           lastMessagePreview: 'Hey Ava, can you verify the response shape?', messageCount: 4, updatedAt: '10:42 AM', unread: true },
  { id: 'ch-2', participants: ['Priya Sharma', 'Marcus Webb'], topic: 'DB snapshot handoff', relatedTicketId: 'SH-146', status: 'AWAITING_REPLY', lastMessagePreview: 'Snapshot ready, awaiting your review.',       messageCount: 2, updatedAt: '10:38 AM' },
  { id: 'ch-3', participants: ['Sonia Patel', 'Ava Chen'],   topic: 'Design tokens',       relatedTicketId: 'SH-143', status: 'OPEN',           lastMessagePreview: 'Tokens uploaded to /design/v2.',                messageCount: 7, updatedAt: '10:31 AM' },
  { id: 'ch-4', participants: ['Ava Chen', 'James Liu'],     topic: 'Code review',         relatedTicketId: 'SH-140', status: 'RESOLVED',       lastMessagePreview: 'Approved. Merging now.',                       messageCount: 3, updatedAt: '10:24 AM' },
  { id: 'ch-5', participants: ['Marcus Webb', 'James Liu'],  topic: 'Deploy pipeline',     relatedTicketId: 'SH-141', status: 'AWAITING_REPLY', lastMessagePreview: 'Pipeline queued, need approval to proceed.',   messageCount: 5, updatedAt: '10:15 AM' },
];
