import type {
  Ticket,
  ProjectAgent,
  SwarmActivity,
  CommunicationChannel,
  Project,
} from './interface';

export const projectsByWorkspace: Record<string, Project> = {
  superhive: {
    id: 'proj-superhive',
    workspaceId: 'superhive',
    title: 'Superhive App',
    tickets: [
      { id: 'SH-142', title: 'Fix Auth Regression',         status: 'TODO',      assignedAgentId: 'sh-ava' },
      { id: 'SH-143', title: 'Implement Onboarding Flow',    status: 'TODO',      assignedAgentId: 'sh-sonia' },
      { id: 'SH-144', title: 'Add Dark Mode to Settings',   status: 'TODO',      assignedAgentId: 'sh-james' },
      { id: 'SH-145', title: 'Refactor API Gateway',        status: 'EXECUTING', assignedAgentId: 'sh-marcus' },
      { id: 'SH-146', title: 'Optimize Database Queries',   status: 'EXECUTING', assignedAgentId: 'sh-priya' },
      { id: 'SH-140', title: 'Update Dependencies',          status: 'DONE',      assignedAgentId: 'sh-ava' },
      { id: 'SH-141', title: 'Fix Login Bug',               status: 'DONE',      assignedAgentId: 'sh-sonia' },
      { id: 'SH-139', title: 'Migrate to TypeScript Strict',status: 'DONE',     assignedAgentId: 'sh-james' },
    ],
    agents: [
      { id: 'sh-ava',    name: 'Ava Chen',     role: 'Frontend Engineer',   currentStatus: 'WORKING',   assignedTicketId: 'SH-142', initials: 'AC' },
      { id: 'sh-marcus', name: 'Marcus Webb',  role: 'API Engineer',         currentStatus: 'COMPILING', assignedTicketId: 'SH-145', initials: 'MW' },
      { id: 'sh-priya',  name: 'Priya Sharma', role: 'Database Engineer',     currentStatus: 'WORKING',   assignedTicketId: 'SH-146', initials: 'PS' },
      { id: 'sh-sonia',  name: 'Sonia Patel',  role: 'Design Engineer',      currentStatus: 'COMPILING', assignedTicketId: 'SH-143', initials: 'SP' },
      { id: 'sh-james',  name: 'James Liu',    role: 'DevOps Engineer',      currentStatus: 'IDLE',      assignedTicketId: null,     initials: 'JL' },
    ],
    channels: [
      { id: 'sh-ch-1', participants: ['Marcus Webb', 'Ava Chen'],      topic: 'Schema validation',   relatedTicketId: 'SH-145', status: 'OPEN',           lastMessagePreview: 'Hey Ava, can you verify the response shape?', messageCount: 4, updatedAt: '10:42 AM', unread: true },
      { id: 'sh-ch-2', participants: ['Priya Sharma', 'Marcus Webb'],    topic: 'DB snapshot handoff',  relatedTicketId: 'SH-146', status: 'AWAITING_REPLY', lastMessagePreview: 'Snapshot ready, awaiting your review.',        messageCount: 2, updatedAt: '10:38 AM' },
      { id: 'sh-ch-3', participants: ['Sonia Patel', 'Ava Chen'],        topic: 'Design tokens',        relatedTicketId: 'SH-143', status: 'OPEN',           lastMessagePreview: 'Tokens uploaded to /design/v2.',               messageCount: 7, updatedAt: '10:31 AM' },
      { id: 'sh-ch-4', participants: ['Ava Chen', 'James Liu'],         topic: 'Code review',          relatedTicketId: 'SH-140', status: 'RESOLVED',       lastMessagePreview: 'Approved. Merging now.',                      messageCount: 3, updatedAt: '10:24 AM' },
      { id: 'sh-ch-5', participants: ['Marcus Webb', 'James Liu'],       topic: 'Deploy pipeline',       relatedTicketId: 'SH-141', status: 'AWAITING_REPLY', lastMessagePreview: 'Pipeline queued, need approval to proceed.',    messageCount: 5, updatedAt: '10:15 AM' },
    ],
    activity: [
      { id: 'sh-act-1', timestamp: '10:42 AM', primaryAgent: 'Marcus Webb',  action: 'requested schema validation from', targetAgent: 'Ava Chen',     context: 'for SH-145' },
      { id: 'sh-act-2', timestamp: '10:38 AM', primaryAgent: 'Priya Sharma', action: 'shared database snapshot with',    targetAgent: 'Marcus Webb',  context: 'for SH-146' },
      { id: 'sh-act-3', timestamp: '10:31 AM', primaryAgent: 'Sonia Patel', action: 'handed off design tokens to',      targetAgent: 'Ava Chen',     context: 'for SH-143' },
      { id: 'sh-act-4', timestamp: '10:24 AM', primaryAgent: 'Ava Chen',    action: 'requested code review from',       targetAgent: 'James Liu',    context: 'for SH-140' },
      { id: 'sh-act-5', timestamp: '10:15 AM', primaryAgent: 'Marcus Webb', action: 'requested deployment pipeline from', targetAgent: 'James Liu',   context: 'for SH-141' },
      { id: 'sh-act-6', timestamp: '10:02 AM', primaryAgent: 'Priya Sharma', action: 'escalated timeout issue to',      targetAgent: 'Ava Chen',     context: 'for SH-142' },
    ],
  },

  mumbrane: {
    id: 'proj-mumbrane',
    workspaceId: 'mumbrane',
    title: 'Mumbrane Platform',
    tickets: [
      { id: 'MB-201', title: 'Implement Webhook Retry Logic',       status: 'EXECUTING', assignedAgentId: 'mb-priya' },
      { id: 'MB-202', title: 'Fix Memory Leak in WebSocket Layer', status: 'TODO',      assignedAgentId: 'mb-marcus' },
      { id: 'MB-203', title: 'Migrate Auth to OAuth 2.1',          status: 'DONE',      assignedAgentId: 'mb-ava' },
      { id: 'MB-204', title: 'Add Audit Log Export to CSV',        status: 'TODO',      assignedAgentId: 'mb-rishi' },
      { id: 'MB-205', title: 'Rate Limiting Middleware',             status: 'EXECUTING', assignedAgentId: 'mb-marcus' },
      { id: 'MB-206', title: 'Integrate Stripe Billing Webhooks',  status: 'TODO',      assignedAgentId: 'mb-priya' },
      { id: 'MB-207', title: 'Fix CORS Preflight Caching',         status: 'DONE',      assignedAgentId: 'mb-ava' },
      { id: 'MB-208', title: 'Add Prometheus Metrics Endpoint',    status: 'DONE',      assignedAgentId: 'mb-rishi' },
    ],
    agents: [
      { id: 'mb-priya',  name: 'Priya Sharma', role: 'Backend Engineer',    currentStatus: 'WORKING',   assignedTicketId: 'MB-201', initials: 'PS' },
      { id: 'mb-marcus', name: 'Marcus Webb',   role: 'Systems Engineer',   currentStatus: 'WORKING',   assignedTicketId: 'MB-202', initials: 'MW' },
      { id: 'mb-ava',    name: 'Ava Chen',      role: 'Security Engineer',   currentStatus: 'COMPILING', assignedTicketId: 'MB-203', initials: 'AC' },
      { id: 'mb-rishi',  name: 'Rishi Iyer',    role: 'DevOps Engineer',     currentStatus: 'IDLE',      assignedTicketId: null,     initials: 'RI' },
    ],
    channels: [
      { id: 'mb-ch-1', participants: ['Priya Sharma', 'Marcus Webb'],   topic: 'Webhook retry strategy',    relatedTicketId: 'MB-201', status: 'OPEN',           lastMessagePreview: 'Should we use exponential backoff or linear?', messageCount: 6, updatedAt: '11:05 AM', unread: true },
      { id: 'mb-ch-2', participants: ['Ava Chen', 'Marcus Webb'],       topic: 'OAuth scope review',       relatedTicketId: 'MB-203', status: 'AWAITING_REPLY', lastMessagePreview: 'The refresh token rotation looks good.',          messageCount: 3, updatedAt: '10:55 AM' },
      { id: 'mb-ch-3', participants: ['Rishi Iyer', 'Priya Sharma'],    topic: 'Prometheus labels',         relatedTicketId: 'MB-208', status: 'RESOLVED',       lastMessagePreview: 'Deployed to staging. All green.',               messageCount: 4, updatedAt: '10:30 AM' },
      { id: 'mb-ch-4', participants: ['Marcus Webb', 'Rishi Iyer'],     topic: 'CORS config sync',          relatedTicketId: 'MB-207', status: 'OPEN',           lastMessagePreview: 'Updated the allowed-origins list.',             messageCount: 2, updatedAt: '09:45 AM' },
      { id: 'mb-ch-5', participants: ['Ava Chen', 'Priya Sharma'],       topic: 'Security audit findings',   relatedTicketId: 'MB-203', status: 'OPEN',           lastMessagePreview: 'One medium finding in the token validation.',    messageCount: 8, updatedAt: '09:20 AM', unread: true },
    ],
    activity: [
      { id: 'mb-act-1', timestamp: '11:05 AM', primaryAgent: 'Priya Sharma', action: 'discussing retry strategy with',  targetAgent: 'Marcus Webb',   context: 'for MB-201' },
      { id: 'mb-act-2', timestamp: '10:55 AM', primaryAgent: 'Ava Chen',     action: 'shared OAuth scope review with',  targetAgent: 'Marcus Webb',   context: 'for MB-203' },
      { id: 'mb-act-3', timestamp: '10:30 AM', primaryAgent: 'Rishi Iyer',   action: 'shipped Prometheus metrics with',  targetAgent: 'Priya Sharma',  context: 'for MB-208' },
      { id: 'mb-act-4', timestamp: '10:10 AM', primaryAgent: 'Marcus Webb',  action: 'filed CORS issue to',             targetAgent: 'Rishi Iyer',    context: 'for MB-207' },
      { id: 'mb-act-5', timestamp: '09:45 AM', primaryAgent: 'Marcus Webb',  action: 'requested metrics labels from',  targetAgent: 'Rishi Iyer',    context: 'for MB-208' },
      { id: 'mb-act-6', timestamp: '09:20 AM', primaryAgent: 'Ava Chen',     action: 'escalated security finding to',  targetAgent: 'Priya Sharma',  context: 'for MB-203' },
    ],
  },

  'sidharda-co': {
    id: 'proj-sidharda',
    workspaceId: 'sidharda-co',
    title: 'Sidharda Website',
    tickets: [
      { id: 'SC-088', title: 'Redesign Marketing Landing Page',     status: 'DONE',    assignedAgentId: 'sc-sonia' },
      { id: 'SC-089', title: 'Fix Broken Image Links in Gallery',   status: 'TODO',      assignedAgentId: 'sc-rishi' },
      { id: 'SC-090', title: 'Setup CI/CD Pipeline for Staging',   status: 'EXECUTING', assignedAgentId: 'sc-james' },
      { id: 'SC-091', title: 'Refactor CSS to Use Design Tokens',  status: 'DONE',      assignedAgentId: 'sc-sonia' },
      { id: 'SC-092', title: 'Add Open Graph Meta Tags',           status: 'TODO',      assignedAgentId: 'sc-rishi' },
      { id: 'SC-093', title: 'SEO Audit and Fix Canonical URLs',   status: 'TODO',      assignedAgentId: 'sc-james' },
    ],
    agents: [
      { id: 'sc-sonia', name: 'Sonia Patel',  role: 'Design Engineer',  currentStatus: 'COMPILING', assignedTicketId: 'SC-088', initials: 'SP' },
      { id: 'sc-rishi', name: 'Rishi Iyer',   role: 'Frontend Engineer', currentStatus: 'WORKING',   assignedTicketId: 'SC-089', initials: 'RI' },
      { id: 'sc-james', name: 'James Liu',    role: 'DevOps Engineer',   currentStatus: 'WORKING',   assignedTicketId: 'SC-090', initials: 'JL' },
    ],
    channels: [
      { id: 'sc-ch-1', participants: ['Sonia Patel', 'Rishi Iyer'],   topic: 'Landing page copy review',  relatedTicketId: 'SC-088', status: 'OPEN',           lastMessagePreview: 'Updated the hero section copy. Please check.',  messageCount: 5, updatedAt: '09:15 AM', unread: true },
      { id: 'sc-ch-2', participants: ['James Liu', 'Rishi Iyer'],     topic: 'CI/CD staging setup',      relatedTicketId: 'SC-090', status: 'AWAITING_REPLY', lastMessagePreview: 'GitHub Actions workflow is ready.',               messageCount: 3, updatedAt: '08:50 AM' },
      { id: 'sc-ch-3', participants: ['Sonia Patel', 'James Liu'],     topic: 'OG tags coordination',     relatedTicketId: 'SC-092', status: 'OPEN',           lastMessagePreview: 'We need OG image dimensions agreed first.',      messageCount: 2, updatedAt: '08:30 AM' },
      { id: 'sc-ch-4', participants: ['Rishi Iyer', 'James Liu'],      topic: 'Broken gallery images',    relatedTicketId: 'SC-089', status: 'RESOLVED',       lastMessagePreview: 'Fixed the Cloudinary URL rewrites. All good.',   messageCount: 4, updatedAt: '08:10 AM' },
    ],
    activity: [
      { id: 'sc-act-1', timestamp: '09:15 AM', primaryAgent: 'Sonia Patel', action: 'shared landing page update with',  targetAgent: 'Rishi Iyer',  context: 'for SC-088' },
      { id: 'sc-act-2', timestamp: '08:50 AM', primaryAgent: 'James Liu',   action: 'requested CI/CD approval from',    targetAgent: 'Rishi Iyer',  context: 'for SC-090' },
      { id: 'sc-act-3', timestamp: '08:30 AM', primaryAgent: 'Sonia Patel', action: 'escalated OG image specs to',      targetAgent: 'James Liu',  context: 'for SC-092' },
      { id: 'sc-act-4', timestamp: '08:10 AM', primaryAgent: 'Rishi Iyer', action: 'fixed broken gallery links with',   targetAgent: 'James Liu',  context: 'for SC-089' },
      { id: 'sc-act-5', timestamp: '07:45 AM', primaryAgent: 'James Liu',  action: 'requested SEO audit from',          targetAgent: 'Rishi Iyer',  context: 'for SC-093' },
    ],
  },

  personal: {
    id: 'proj-personal',
    workspaceId: 'personal',
    title: 'Personal Projects',
    tickets: [
      { id: 'PL-013', title: 'Build Side Project Dashboard',    status: 'TODO',      assignedAgentId: 'pl-rishi' },
      { id: 'PL-014', title: 'Write Documentation for API',     status: 'DONE',    assignedAgentId: 'pl-sonia' },
      { id: 'PL-015', title: 'Set Up Monitoring for Side App',   status: 'TODO',      assignedAgentId: 'pl-rishi' },
      { id: 'PL-016', title: 'Design Logo for Side Project',     status: 'EXECUTING', assignedAgentId: 'pl-sonia' },
    ],
    agents: [
      { id: 'pl-rishi',  name: 'Rishi Iyer',  role: 'Full-Stack Engineer', currentStatus: 'WORKING',   assignedTicketId: 'PL-013', initials: 'RI' },
      { id: 'pl-sonia',  name: 'Sonia Patel', role: 'Designer',               currentStatus: 'WORKING',   assignedTicketId: 'PL-016', initials: 'SP' },
    ],
    channels: [
      { id: 'pl-ch-1', participants: ['Rishi Iyer', 'Sonia Patel'], topic: 'Dashboard wireframe review', relatedTicketId: 'PL-013', status: 'OPEN',           lastMessagePreview: 'Wireframe v2 is uploaded. Thoughts?',         messageCount: 3, updatedAt: '07:00 AM', unread: true },
      { id: 'pl-ch-2', participants: ['Sonia Patel', 'Rishi Iyer'], topic: 'Logo design direction',    relatedTicketId: 'PL-016', status: 'AWAITING_REPLY', lastMessagePreview: 'Three directions ready for your review.',         messageCount: 2, updatedAt: '06:45 AM' },
      { id: 'pl-ch-3', participants: ['Rishi Iyer', 'Sonia Patel'], topic: 'API docs outline',         relatedTicketId: 'PL-014', status: 'RESOLVED',       lastMessagePreview: 'Docs are up on Notion. Closing this thread.',  messageCount: 6, updatedAt: '06:30 AM' },
    ],
    activity: [
      { id: 'pl-act-1', timestamp: '07:00 AM', primaryAgent: 'Rishi Iyer',  action: 'shared dashboard wireframe with',  targetAgent: 'Sonia Patel', context: 'for PL-013' },
      { id: 'pl-act-2', timestamp: '06:45 AM', primaryAgent: 'Sonia Patel', action: 'presented logo directions to',     targetAgent: 'Rishi Iyer',  context: 'for PL-016' },
      { id: 'pl-act-3', timestamp: '06:30 AM', primaryAgent: 'Rishi Iyer',  action: 'approved API docs outline with',    targetAgent: 'Sonia Patel', context: 'for PL-014' },
      { id: 'pl-act-4', timestamp: '06:15 AM', primaryAgent: 'Sonia Patel', action: 'requested monitoring input from', targetAgent: 'Rishi Iyer',  context: 'for PL-015' },
    ],
  },
};

export const projectTitle = 'Superhive App';
export const tickets: Ticket[] = [];
export const projectAgents: ProjectAgent[] = [];
export const swarmActivity: SwarmActivity[] = [];
export const channels: CommunicationChannel[] = [];
