/**
 * Settings domain types — all user preferences for the app.
 */

import defaultSettings from './settings.json';

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

export const DEFAULT_SETTINGS: Settings = defaultSettings as Settings;
