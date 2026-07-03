/**
 * Settings domain types — all user preferences for the app.
 */

import defaultSettings from './settings.json';

export type ThemeId = string;

export type Theme = {
  id: ThemeId;
  name: string;
  vars: Record<string, string>;
  systemVars?: Record<string, string>;
};

export type AppearanceSettings = {
  theme: ThemeId;
  highlightColor: string;
  fontScale: number;
  reduceMotion: boolean;
};

export type DefaultsSettings = {
  defaultWorkspaceId: string | null;
};

export type ModelProviderConfig = {
  id: string;
  label: string;
  apiKey: string;
  baseUrl: string;
  models: string[];
  isCustom: boolean;
  catalogId?: string;
  createdAt?: string;
};

export type ModelsSettings = {
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

export type PlanTier = 'free' | 'pro' | 'meta-hive' | 'enterprise';

export type Plan = {
  tier: PlanTier;
  name: string;
  priceMonthly: number;
  includedQuota: string;
  seats: number;
  metaHiveAgents?: number;
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
  defaults: DefaultsSettings;
  models: ModelsSettings;
  workflows: WorkflowsSettings;
  billing: BillingSettings;
  account: AccountSettings;
};

export type SettingsStore = {
  settings: Settings;
  update: <K extends keyof Settings>(domain: K, patch: Partial<Settings[K]>) => void;
  resetAll: () => void;
  exportJson: () => string;
};

export const STORAGE_KEY = 'superhive-settings-v2';

export const DEFAULT_SETTINGS: Settings = defaultSettings as Settings;
