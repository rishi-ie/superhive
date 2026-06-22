import type { UniversalTicket } from './interface';

const universalTickets: UniversalTicket[] = [
  { id: 'SH-142', title: 'Fix Auth Regression on Mobile Login',  projectName: 'Superhive App',     status: 'EXECUTING', priority: 'HIGH',   type: 'BUG',      assignee: { name: 'Marcus Webb',  isAI: true  } },
  { id: 'SH-143', title: 'Implement Onboarding Flow',           projectName: 'Superhive App',     status: 'BACKLOG',   priority: 'MEDIUM', type: 'FEATURE',  assignee: { name: 'Sonia Patel',  isAI: true  } },
  { id: 'SH-144', title: 'Add Dark Mode to Settings',           projectName: 'Superhive App',     status: 'BACKLOG',   priority: 'LOW',    type: 'FEATURE',  assignee: { name: 'Rishi Iyer',  isAI: false } },
  { id: 'SH-145', title: 'Refactor API Gateway Routing',        projectName: 'Superhive App',     status: 'EXECUTING', priority: 'HIGH',   type: 'REFACTOR', assignee: { name: 'Marcus Webb',  isAI: true  } },
  { id: 'SH-146', title: 'Optimize Slow Database Queries',      projectName: 'Superhive App',     status: 'REVIEW',    priority: 'MEDIUM', type: 'REFACTOR', assignee: { name: 'Priya Sharma', isAI: true  } },
  { id: 'SH-140', title: 'Update Outdated Dependencies',        projectName: 'Superhive App',     status: 'MERGED',    priority: 'LOW',    type: 'REFACTOR', assignee: { name: 'Ava Chen',     isAI: true  } },
  { id: 'SH-141', title: 'Fix Login Button Not Responding',    projectName: 'Superhive App',     status: 'MERGED',    priority: 'HIGH',   type: 'BUG',      assignee: { name: 'Sonia Patel',  isAI: true  } },

  { id: 'MB-201', title: 'Implement Webhook Retry Logic',       projectName: 'Mumbrane Platform', status: 'EXECUTING', priority: 'HIGH',   type: 'FEATURE',  assignee: { name: 'Priya Sharma', isAI: true  } },
  { id: 'MB-202', title: 'Fix Memory Leak in WebSocket Layer', projectName: 'Mumbrane Platform', status: 'BACKLOG',   priority: 'HIGH',   type: 'BUG',      assignee: { name: 'Marcus Webb',  isAI: true  } },
  { id: 'MB-203', title: 'Migrate Auth to OAuth 2.1',          projectName: 'Mumbrane Platform', status: 'REVIEW',    priority: 'MEDIUM', type: 'REFACTOR', assignee: { name: 'Ava Chen',     isAI: true  } },
  { id: 'MB-204', title: 'Add Audit Log Export to CSV',        projectName: 'Mumbrane Platform', status: 'BACKLOG',   priority: 'LOW',    type: 'FEATURE',  assignee: { name: 'Rishi Iyer',  isAI: false } },

  { id: 'SC-088', title: 'Redesign Marketing Landing Page',     projectName: 'Sidharda Co',       status: 'REVIEW',    priority: 'MEDIUM', type: 'FEATURE',  assignee: { name: 'Sonia Patel',  isAI: true  } },
  { id: 'SC-089', title: 'Fix Broken Image Links in Gallery',   projectName: 'Sidharda Co',       status: 'BACKLOG',   priority: 'LOW',    type: 'BUG',      assignee: { name: 'Rishi Iyer',  isAI: false } },
  { id: 'SC-090', title: 'Setup CI/CD Pipeline for Staging',   projectName: 'Sidharda Co',       status: 'EXECUTING', priority: 'HIGH',   type: 'FEATURE',  assignee: { name: 'James Liu',    isAI: true  } },
  { id: 'SC-091', title: 'Refactor CSS to Use Design Tokens', projectName: 'Sidharda Co',       status: 'MERGED',    priority: 'LOW',    type: 'REFACTOR', assignee: { name: 'Ava Chen',     isAI: true  } },

  { id: 'PL-013', title: 'Build Side Project Dashboard',        projectName: 'Personal',          status: 'BACKLOG',   priority: 'LOW',    type: 'FEATURE',  assignee: { name: 'Rishi Iyer',  isAI: false } },
  { id: 'PL-014', title: 'Write Documentation for API',       projectName: 'Personal',          status: 'REVIEW',    priority: 'MEDIUM', type: 'FEATURE',  assignee: { name: 'Sonia Patel',  isAI: true  } },
];

export { universalTickets };
