import type { UniversalTicket } from './interface';

const universalTickets: UniversalTicket[] = [
  { id: 'SH-142', title: 'Fix Auth Regression on Mobile Login',  projectName: 'Superhive App',     workspaceId: 'superhive',    status: 'EXECUTING', priority: 'HIGH',   type: 'BUG',      assignee: { name: 'Marcus Webb',  isAI: true  } },
  { id: 'SH-143', title: 'Implement Onboarding Flow',           projectName: 'Superhive App',     workspaceId: 'superhive',    status: 'BACKLOG',   priority: 'MEDIUM', type: 'FEATURE',  assignee: { name: 'Sonia Patel',  isAI: true  } },
  { id: 'SH-144', title: 'Add Dark Mode to Settings',           projectName: 'Superhive App',     workspaceId: 'superhive',    status: 'BACKLOG',   priority: 'LOW',    type: 'FEATURE',  assignee: { name: 'Rishi Iyer',  isAI: false } },
  { id: 'SH-145', title: 'Refactor API Gateway Routing',        projectName: 'Superhive App',     workspaceId: 'superhive',    status: 'EXECUTING', priority: 'HIGH',   type: 'REFACTOR', assignee: { name: 'Marcus Webb',  isAI: true  } },
  { id: 'SH-146', title: 'Optimize Slow Database Queries',      projectName: 'Superhive App',     workspaceId: 'superhive',    status: 'REVIEW',    priority: 'MEDIUM', type: 'REFACTOR', assignee: { name: 'Priya Sharma', isAI: true  } },
  { id: 'SH-140', title: 'Update Outdated Dependencies',        projectName: 'Superhive App',     workspaceId: 'superhive',    status: 'MERGED',    priority: 'LOW',    type: 'REFACTOR', assignee: { name: 'Ava Chen',     isAI: true  } },
  { id: 'SH-141', title: 'Fix Login Button Not Responding',    projectName: 'Superhive App',     workspaceId: 'superhive',    status: 'MERGED',    priority: 'HIGH',   type: 'BUG',      assignee: { name: 'Sonia Patel',  isAI: true  } },

  { id: 'MB-201', title: 'Implement Webhook Retry Logic',       projectName: 'Mumbrane Platform', workspaceId: 'mumbrane',    status: 'EXECUTING', priority: 'HIGH',   type: 'FEATURE',  assignee: { name: 'Priya Sharma', isAI: true  } },
  { id: 'MB-202', title: 'Fix Memory Leak in WebSocket Layer', projectName: 'Mumbrane Platform', workspaceId: 'mumbrane',    status: 'BACKLOG',   priority: 'HIGH',   type: 'BUG',      assignee: { name: 'Marcus Webb',  isAI: true  } },
  { id: 'MB-203', title: 'Migrate Auth to OAuth 2.1',          projectName: 'Mumbrane Platform', workspaceId: 'mumbrane',    status: 'REVIEW',    priority: 'MEDIUM', type: 'REFACTOR', assignee: { name: 'Ava Chen',     isAI: true  } },
  { id: 'MB-204', title: 'Add Audit Log Export to CSV',        projectName: 'Mumbrane Platform', workspaceId: 'mumbrane',    status: 'BACKLOG',   priority: 'LOW',    type: 'FEATURE',  assignee: { name: 'Rishi Iyer',  isAI: false } },

  { id: 'SC-088', title: 'Redesign Marketing Landing Page',     projectName: 'Sidharda Co',       workspaceId: 'sidharda-co',  status: 'REVIEW',    priority: 'MEDIUM', type: 'FEATURE',  assignee: { name: 'Sonia Patel',  isAI: true  } },
  { id: 'SC-089', title: 'Fix Broken Image Links in Gallery',   projectName: 'Sidharda Co',       workspaceId: 'sidharda-co',  status: 'BACKLOG',   priority: 'LOW',    type: 'BUG',      assignee: { name: 'Rishi Iyer',  isAI: false } },
  { id: 'SC-090', title: 'Setup CI/CD Pipeline for Staging',   projectName: 'Sidharda Co',       workspaceId: 'sidharda-co',  status: 'EXECUTING', priority: 'HIGH',   type: 'FEATURE',  assignee: { name: 'James Liu',    isAI: true  } },
  { id: 'SC-091', title: 'Refactor CSS to Use Design Tokens', projectName: 'Sidharda Co',       workspaceId: 'sidharda-co',  status: 'MERGED',    priority: 'LOW',    type: 'REFACTOR', assignee: { name: 'Ava Chen',     isAI: true  } },

  { id: 'PL-013', title: 'Build Side Project Dashboard',        projectName: 'Personal',          workspaceId: 'personal',     status: 'BACKLOG',   priority: 'LOW',    type: 'FEATURE',  assignee: { name: 'Rishi Iyer',  isAI: false } },
  { id: 'PL-014', title: 'Write Documentation for API',       projectName: 'Personal',          workspaceId: 'personal',     status: 'REVIEW',    priority: 'MEDIUM', type: 'FEATURE',  assignee: { name: 'Sonia Patel',  isAI: true  } },
];

export { universalTickets };
