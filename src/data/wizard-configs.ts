import { Sparkles, Layers, ClipboardCheck, Bot, MessageCircle, Users, GitBranch, FolderOpen, MessageSquare, UsersRound } from 'lucide-react';
import type { WizardConfig } from '@/components/center-workspace/OnboardingWizard';

export const PROJECTS_WIZARD_CONFIG: WizardConfig = {
  icon: Layers,
  title: 'Set up your first project',
  subtitle: 'Projects are containers for tickets, agents, and communications',
  skipLabel: 'Skip and go home',
  actions: [
    {
      id: 'create-project',
      icon: Layers,
      title: 'Create new project',
      description: 'Start from scratch with a fresh workspace',
      recommended: true,
    },
    {
      id: 'import-repo',
      icon: MessageCircle,
      title: 'Import existing repo',
      description: 'Connect GitHub, GitLab, or a local folder',
    },
    {
      id: 'use-template',
      icon: Bot,
      title: 'Use a template',
      description: 'Pick from a curated starter (SaaS, mobile, API)',
    },
    {
      id: 'migrate',
      icon: Bot,
      title: 'Migrate from another tool',
      description: 'Bring work from Jira, Linear, or Asana',
    },
  ],
};

export const TICKETS_WIZARD_CONFIG: WizardConfig = {
  icon: ClipboardCheck,
  title: 'Create your first ticket',
  subtitle: 'Tickets break work into trackable units for the swarm',
  skipLabel: 'Skip and go home',
  actions: [
    {
      id: 'create-ticket',
      icon: ClipboardCheck,
      title: 'Create a ticket',
      description: 'Define a single unit of work for an agent',
      recommended: true,
    },
    {
      id: 'use-template',
      icon: ClipboardCheck,
      title: 'Use a template',
      description: 'Bug report, feature request, or refactor task',
    },
    {
      id: 'bulk-import',
      icon: Layers,
      title: 'Bulk import',
      description: 'Paste a CSV or import from Jira/Linear',
    },
    {
      id: 'auto-generate',
      icon: Bot,
      title: 'Auto-generate from PRD',
      description: 'Paste a spec and let agents break it down',
    },
  ],
};

export const AGENTS_WIZARD_CONFIG: WizardConfig = {
  icon: Bot,
  title: 'Add your first agent',
  subtitle: 'AI agents execute work, monitor systems, and coordinate with the swarm',
  skipLabel: 'Skip and go home',
  actions: [
    {
      id: 'configure-agent',
      icon: Bot,
      title: 'Configure new agent',
      description: 'Pick a model, permissions, and scope',
      recommended: true,
    },
    {
      id: 'use-template',
      icon: ClipboardCheck,
      title: 'Use a template',
      description: 'Sonnet, Opus 4.8, or Codex starter profiles',
    },
    {
      id: 'clone-agent',
      icon: Users,
      title: 'Clone from existing',
      description: 'Duplicate an agent and customize it',
    },
    {
      id: 'browse-marketplace',
      icon: Layers,
      title: 'Browse agent marketplace',
      description: 'Find pre-built agents for common tasks',
    },
  ],
};

export const CHAT_WIZARD_CONFIG: WizardConfig = {
  icon: MessageCircle,
  title: 'Start your first chat thread',
  subtitle: 'Chat with an agent to brainstorm, delegate, or just talk',
  skipLabel: 'Skip and go home',
  actions: [
    {
      id: 'new-thread',
      icon: MessageCircle,
      title: 'New chat thread',
      description: 'Start a conversation with your agent workforce',
      recommended: true,
    },
    {
      id: 'use-template',
      icon: ClipboardCheck,
      title: 'Use a template',
      description: 'Standup, retro, code review — start with a structure',
    },
    {
      id: 'invite-agent',
      icon: Bot,
      title: 'Invite an agent',
      description: 'Add a specialized agent to the conversation',
    },
    {
      id: 'import-thread',
      icon: Layers,
      title: 'Import conversation',
      description: 'Bring in an existing thread from Slack or email',
    },
  ],
};

export const COMMUNICATIONS_WIZARD_CONFIG: WizardConfig = {
  icon: MessageCircle,
  title: 'Set up your first channel',
  subtitle: 'Channels are where agents and humans coordinate work',
  skipLabel: 'Skip and go home',
  actions: [
    {
      id: 'create-channel',
      icon: MessageCircle,
      title: 'Create a channel',
      description: 'Start a topic-scoped thread for the swarm',
      recommended: true,
    },
    {
      id: 'connect-slack',
      icon: MessageCircle,
      title: 'Connect Slack',
      description: 'Sync messages from your existing workspace',
    },
    {
      id: 'connect-discord',
      icon: Bot,
      title: 'Connect Discord',
      description: 'Bring community conversations into the swarm',
    },
    {
      id: 'use-template',
      icon: ClipboardCheck,
      title: 'Use a template',
      description: 'Standup, code-review, incident-response channels',
    },
  ],
};

export const UNIVERSAL_CHANNELS_WIZARD_CONFIG: WizardConfig = {
  icon: MessageSquare,
  title: 'Browse all channels',
  subtitle: 'Channels are where agents and humans coordinate work',
  skipLabel: 'Skip and go home',
  actions: [
    {
      id: 'browse-channels',
      icon: MessageSquare,
      title: 'Browse all channels',
      description: 'View communications across all workspaces',
      recommended: true,
    },
    {
      id: 'create-channel',
      icon: MessageCircle,
      title: 'Create a channel',
      description: 'Start a topic-scoped thread for the swarm',
    },
    {
      id: 'connect-slack',
      icon: MessageCircle,
      title: 'Connect Slack',
      description: 'Sync messages from your existing workspace',
    },
    {
      id: 'use-template',
      icon: ClipboardCheck,
      title: 'Use a template',
      description: 'Standup, code-review, incident-response channels',
    },
  ],
};

export const CENTER_EMPTY_STATE_CONFIG: WizardConfig = {
  icon: Sparkles,
  title: 'No tab open',
  subtitle: 'Select a project, agent, ticket, or channel from the sidebar to get started',
  skipLabel: undefined,
  actions: [
    {
      id: 'open-projects',
      icon: Layers,
      title: 'Open Projects',
      description: 'View the workspace kanban dashboard',
    },
    {
      id: 'open-agents',
      icon: Bot,
      title: 'Open Agents',
      description: 'Browse and chat with workspace agents',
      recommended: true,
    },
    {
      id: 'open-tickets',
      icon: ClipboardCheck,
      title: 'Open Tickets',
      description: 'View the workspace ticket board',
    },
    {
      id: 'open-comms',
      icon: MessageCircle,
      title: 'Open Communications',
      description: 'View agent-to-agent communication channels',
    },
    {
      id: 'browse-projects',
      icon: FolderOpen,
      title: 'Browse Projects',
      description: 'Explore all projects across workspaces',
    },
    {
      id: 'browse-agents',
      icon: UsersRound,
      title: 'Browse All Agents',
      description: 'View all agents across workspaces',
    },
  ],
};
