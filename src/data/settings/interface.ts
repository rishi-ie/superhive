/**
 * Settings domain types — all user preferences for the app.
 */

export type ThemeId = 'light' | 'dark' | 'system';

export type Theme = {
  id: ThemeId;
  name: string;
  vars: Record<string, string>;
};

export type AppearanceSettings = {
  theme: ThemeId;
  accentColor: string;
  fontScale: number;
  reduceMotion: boolean;
  codeSyntaxTheme: string;
};

export type QuietHours = {
  enabled: boolean;
  start: string;
  end: string;
  days: number[];
};

export type NotificationsSettings = {
  quietHours: QuietHours;
};

export type PrivacySettings = {
  exportDataLastRun: string | null;
  conversationRetentionDays: number;
};

export type AccessibilitySettings = {
  reduceMotion: boolean;
};

export type StartupView = 'last' | 'universal-agents' | 'universal-channels' | 'universal-projects' | 'tickets' | 'swarm-roster';
export type ViewMode = 'compact' | 'comfortable';
export type TimeFormat = '12h' | '24h' | 'relative';
export type KanbanColumn = 'todo' | 'executing' | 'review' | 'merged';
export type RightPanelTab = 'overview' | 'manage' | 'inbox' | 'sessions';

export type DefaultsSettings = {
  startupView: StartupView;
  defaultWorkspaceId: string | null;
  viewMode: ViewMode;
  timeFormat: TimeFormat;
  defaultKanbanColumns: KanbanColumn[];
  rightPanelDefaultTab: RightPanelTab;
};

export type ShortcutGroup = {
  label: string;
  shortcuts: Shortcut[];
};

export type Shortcut = {
  keys: string;
  description: string;
};

export type KeyboardSettings = {
  groups: ShortcutGroup[];
};

export type ModelProvider = 'openai' | 'anthropic' | 'google' | 'cohere' | 'custom';
export type EngineId = 'opus' | 'sonnet' | 'claude' | 'codex';

export type Engine = {
  id: EngineId;
  label: string;
  enabled: boolean;
};

export type ModelProviderConfig = {
  id: ModelProvider;
  label: string;
  apiKey: string;
  fallbackOrder: EngineId[];
  customEndpointUrl: string;
};

export type ModelsSettings = {
  engines: Engine[];
  providers: ModelProviderConfig[];
};

export type WorkflowTrigger = {
  id: string;
  name: string;
  type: 'schedule' | 'event' | 'webhook';
  cronExpression: string;
  lastRun: string | null;
};

export type WorkflowsSettings = {
  workflows: WorkflowTrigger[];
};

export type SpendAlert = {
  thresholdPercent: number;
  enabled: boolean;
};

export type CostUsageSettings = {
  monthlyBudgetCap: number;
  monthlyBudgetEnabled: boolean;
  perAgentSpendingLimit: number;
  perAgentSpendingEnabled: boolean;
  spendAlert: SpendAlert;
  resetCycleDay: number;
  usageData: UsageDataPoint[];
};

export type UsageDataPoint = {
  date: string;
  cost: number;
  agentId: string;
  workspaceId: string;
};

export type AgentsSettings = {
  defaultEngine: EngineId;
};

export type WorkspaceItem = {
  id: string;
  name: string;
  dataRetentionDays: number;
  createdAt: string;
};

export type WorkspacesSettings = {
  workspaces: WorkspaceItem[];
};

export type IntegrationProvider = 'github' | 'slack' | 'linear' | 'notion' | 'jira' | 'webhook';

export type IntegrationChannel = {
  id: string;
  name: string;
  events: string[];
};

export type Integration = {
  id: string;
  provider: IntegrationProvider;
  label: string;
  connected: boolean;
  channels: IntegrationChannel[];
};

export type IntegrationsSettings = {
  integrations: Integration[];
};

export type PlanTier = 'free' | 'pro' | 'enterprise';

export type Plan = {
  tier: PlanTier;
  name: string;
  priceMonthly: number;
  includedQuota: string;
  seats: number;
  canUpgrade: boolean;
};

export type PaymentMethod = {
  brand: string;
  last4: string;
  expiry: string;
};

export type BillingSettings = {
  plan: Plan;
  paymentMethod: PaymentMethod | null;
};

export type ConnectedAccount = {
  provider: 'github' | 'google' | 'apple';
  label: string;
  connected: boolean;
  email: string | null;
};

export type AccountSettings = {
  name: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  accentColor: string;
  connectedAccounts: ConnectedAccount[];
  defaultWorkspaceId: string | null;
  timezone: string;
};

export type Settings = {
  appearance: AppearanceSettings;
  notifications: NotificationsSettings;
  privacy: PrivacySettings;
  accessibility: AccessibilitySettings;
  defaults: DefaultsSettings;
  keyboard: KeyboardSettings;
  models: ModelsSettings;
  workflows: WorkflowsSettings;
  costUsage: CostUsageSettings;
  agents: AgentsSettings;
  workspaces: WorkspacesSettings;
  integrations: IntegrationsSettings;
  billing: BillingSettings;
  account: AccountSettings;
};

export type SettingsStore = {
  settings: Settings;
  update: <K extends keyof Settings>(domain: K, patch: Partial<Settings[K]>) => void;
  resetAll: () => void;
  exportJson: () => string;
};

export const STORAGE_KEY = 'superhive-settings-v1';

export const DEFAULT_SETTINGS: Settings = {
  appearance: {
    theme: 'dark',
    accentColor: '#e07850',
    fontScale: 1,
    reduceMotion: false,
    codeSyntaxTheme: 'github-dark',
  },
  notifications: {
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
      days: [0, 1, 2, 3, 4],
    },
  },
  privacy: {
    exportDataLastRun: null,
    conversationRetentionDays: 90,
  },
  accessibility: {
    reduceMotion: false,
  },
  defaults: {
    startupView: 'last',
    defaultWorkspaceId: null,
    viewMode: 'comfortable',
    timeFormat: 'relative',
    defaultKanbanColumns: ['todo', 'executing', 'review', 'merged'],
    rightPanelDefaultTab: 'overview',
  },
  keyboard: {
    groups: [
      {
        label: 'Global',
        shortcuts: [
          { keys: '⌘K', description: 'Open command palette' },
          { keys: '⌘.', description: 'Open settings' },
          { keys: '⌘1–9', description: 'Switch workspace' },
        ],
      },
      {
        label: 'Tabs',
        shortcuts: [
          { keys: '⌘T', description: 'New tab' },
          { keys: '⌘W', description: 'Close tab' },
          { keys: '⌘⇧[', description: 'Previous tab' },
          { keys: '⌘⇧]', description: 'Next tab' },
        ],
      },
      {
        label: 'Right Panel',
        shortcuts: [
          { keys: '⌘⇧O', description: 'Overview tab' },
          { keys: '⌘⇧M', description: 'Manage tab' },
          { keys: '⌘⇧I', description: 'Inbox tab' },
          { keys: '⌘⇧S', description: 'Sessions tab' },
          { keys: 'Esc', description: 'Dismiss panel' },
        ],
      },
      {
        label: 'Tickets & Channels',
        shortcuts: [
          { keys: 'N', description: 'New ticket' },
          { keys: 'M', description: 'Send message (in channel)' },
          { keys: '@', description: 'Open mention picker' },
        ],
      },
    ],
  },
  models: {
    engines: [
      { id: 'opus', label: 'Opus 4.8', enabled: true },
      { id: 'sonnet', label: 'Sonnet 4', enabled: true },
      { id: 'claude', label: 'Claude 3.5', enabled: true },
      { id: 'codex', label: 'Codex', enabled: true },
    ],
    providers: [
      {
        id: 'openai',
        label: 'OpenAI',
        apiKey: '',
        fallbackOrder: ['sonnet', 'claude'],
        customEndpointUrl: '',
      },
      {
        id: 'anthropic',
        label: 'Anthropic',
        apiKey: '',
        fallbackOrder: ['opus', 'sonnet'],
        customEndpointUrl: '',
      },
      {
        id: 'google',
        label: 'Google AI',
        apiKey: '',
        fallbackOrder: ['claude', 'sonnet'],
        customEndpointUrl: '',
      },
    ],
  },
  workflows: {
    workflows: [
      {
        id: 'wf-1',
        name: 'Daily Standup Summary',
        type: 'schedule',
        cronExpression: '0 9 * * 1-5',
        lastRun: '2026-06-25T09:00:00Z',
      },
      {
        id: 'wf-2',
        name: 'Ticket Review Reminder',
        type: 'schedule',
        cronExpression: '0 14 * * 5',
        lastRun: '2026-06-20T14:00:00Z',
      },
    ],
  },
  costUsage: {
    monthlyBudgetCap: 500,
    monthlyBudgetEnabled: false,
    perAgentSpendingLimit: 100,
    perAgentSpendingEnabled: false,
    spendAlert: {
      thresholdPercent: 80,
      enabled: true,
    },
    resetCycleDay: 1,
    usageData: [
      { date: '2026-06-01', cost: 12.4, agentId: 'agent-1', workspaceId: 'ws-1' },
      { date: '2026-06-02', cost: 8.2, agentId: 'agent-1', workspaceId: 'ws-1' },
      { date: '2026-06-03', cost: 15.7, agentId: 'agent-2', workspaceId: 'ws-1' },
      { date: '2026-06-04', cost: 6.1, agentId: 'agent-1', workspaceId: 'ws-2' },
      { date: '2026-06-05', cost: 22.3, agentId: 'agent-3', workspaceId: 'ws-1' },
      { date: '2026-06-08', cost: 9.8, agentId: 'agent-1', workspaceId: 'ws-1' },
      { date: '2026-06-09', cost: 11.2, agentId: 'agent-2', workspaceId: 'ws-2' },
      { date: '2026-06-10', cost: 7.5, agentId: 'agent-1', workspaceId: 'ws-1' },
      { date: '2026-06-11', cost: 18.9, agentId: 'agent-3', workspaceId: 'ws-1' },
      { date: '2026-06-12', cost: 5.4, agentId: 'agent-1', workspaceId: 'ws-2' },
      { date: '2026-06-15', cost: 14.1, agentId: 'agent-2', workspaceId: 'ws-1' },
      { date: '2026-06-16', cost: 8.7, agentId: 'agent-1', workspaceId: 'ws-1' },
      { date: '2026-06-17', cost: 21.3, agentId: 'agent-3', workspaceId: 'ws-2' },
      { date: '2026-06-18', cost: 6.9, agentId: 'agent-1', workspaceId: 'ws-1' },
      { date: '2026-06-19', cost: 10.2, agentId: 'agent-2', workspaceId: 'ws-1' },
      { date: '2026-06-22', cost: 13.5, agentId: 'agent-1', workspaceId: 'ws-2' },
      { date: '2026-06-23', cost: 7.8, agentId: 'agent-3', workspaceId: 'ws-1' },
      { date: '2026-06-24', cost: 19.4, agentId: 'agent-1', workspaceId: 'ws-1' },
      { date: '2026-06-25', cost: 9.1, agentId: 'agent-2', workspaceId: 'ws-2' },
    ],
  },
  agents: {
    defaultEngine: 'sonnet',
  },
  workspaces: {
    workspaces: [
      {
        id: 'ws-vela',
        name: 'Vela',
        dataRetentionDays: 90,
        createdAt: '2026-01-15T00:00:00Z',
      },
      {
        id: 'ws-cosmos',
        name: 'Cosmos',
        dataRetentionDays: 90,
        createdAt: '2026-02-20T00:00:00Z',
      },
    ],
  },
  integrations: {
    integrations: [
      {
        id: 'int-github',
        provider: 'github',
        label: 'GitHub',
        connected: true,
        channels: [
          { id: 'ch-github-1', name: 'superhive/repo', events: ['push', 'pull_request', 'issue'] },
        ],
      },
      {
        id: 'int-slack',
        provider: 'slack',
        label: 'Slack',
        connected: false,
        channels: [],
      },
      {
        id: 'int-linear',
        provider: 'linear',
        label: 'Linear',
        connected: false,
        channels: [],
      },
      {
        id: 'int-notion',
        provider: 'notion',
        label: 'Notion',
        connected: false,
        channels: [],
      },
      {
        id: 'int-jira',
        provider: 'jira',
        label: 'Jira',
        connected: false,
        channels: [],
      },
      {
        id: 'int-webhook',
        provider: 'webhook',
        label: 'Custom Webhook',
        connected: false,
        channels: [],
      },
    ],
  },
  billing: {
    plan: {
      tier: 'pro',
      name: 'Pro',
      priceMonthly: 49,
      includedQuota: '50 agent-hours / month',
      seats: 5,
      canUpgrade: true,
    },
    paymentMethod: {
      brand: 'Visa',
      last4: '4242',
      expiry: '12/27',
    },
  },
  account: {
    name: 'Your Name',
    email: 'you@example.com',
    username: 'you',
    avatarUrl: null,
    accentColor: '#e07850',
    connectedAccounts: [
      { provider: 'github', label: 'GitHub', connected: true, email: 'you@github.com' },
      { provider: 'google', label: 'Google', connected: false, email: null },
      { provider: 'apple', label: 'Apple', connected: false, email: null },
    ],
    defaultWorkspaceId: null,
    timezone: 'America/New_York',
  },
};
