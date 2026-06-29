/**
 * Settings registry — single source of truth for all settings pages, categories, and navigation metadata.
 */
import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  User,
  Paintbrush,
  Shield,
  SlidersHorizontal,
  Keyboard,
  Globe,
  Workflow,
  Coins,
  Folder,
  CreditCard,
} from 'lucide-react';

import { AccountSettings } from '@/components/settings/AccountSettings';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
import { PrivacySettings } from '@/components/settings/PrivacySettings';
import { DefaultsSettings } from '@/components/settings/DefaultsSettings';
import { KeyboardSettings } from '@/components/settings/KeyboardSettings';
import { ModelsSettings } from '@/components/settings/ModelsSettings';
import { WorkflowsSettings } from '@/components/settings/WorkflowsSettings';
import { CostUsageSettings } from '@/components/settings/CostUsageSettings';
import { WorkspacesSettings } from '@/components/settings/WorkspacesSettings';
import { BillingSettings } from '@/components/settings/BillingSettings';

export type SettingsCategoryId = 'personal' | 'workflow' | 'organization';
export type SettingsSectionId =
  | 'account'
  | 'appearance'
  | 'privacy'
  | 'defaults'
  | 'keyboard'
  | 'models'
  | 'workflows'
  | 'cost-usage'
  | 'workspaces'
  | 'billing';

export type SettingsPageEntry = {
  id: SettingsSectionId;
  label: string;
  icon: LucideIcon;
  component: ComponentType;
  category: SettingsCategoryId;
  comingSoon?: boolean;
};

export type SettingsCategoryMeta = {
  id: SettingsCategoryId;
  label: string;
  sections: SettingsSectionId[];
};

export const settingsRegistry: Record<SettingsSectionId, SettingsPageEntry> = {
  account: {
    id: 'account',
    label: 'Account',
    icon: User,
    component: AccountSettings,
    category: 'personal',
  },
  appearance: {
    id: 'appearance',
    label: 'Appearance',
    icon: Paintbrush,
    component: AppearanceSettings,
    category: 'personal',
  },
  privacy: {
    id: 'privacy',
    label: 'Privacy & Data',
    icon: Shield,
    component: PrivacySettings,
    category: 'personal',
  },
  defaults: {
    id: 'defaults',
    label: 'Defaults',
    icon: SlidersHorizontal,
    component: DefaultsSettings,
    category: 'workflow',
  },
  keyboard: {
    id: 'keyboard',
    label: 'Keyboard',
    icon: Keyboard,
    component: KeyboardSettings,
    category: 'workflow',
  },
  models: {
    id: 'models',
    label: 'Models',
    icon: Globe,
    component: ModelsSettings,
    category: 'workflow',
  },
  workflows: {
    id: 'workflows',
    label: 'Workflows',
    icon: Workflow,
    component: WorkflowsSettings,
    category: 'workflow',
    comingSoon: true,
  },
  'cost-usage': {
    id: 'cost-usage',
    label: 'Cost & Usage',
    icon: Coins,
    component: CostUsageSettings,
    category: 'workflow',
    comingSoon: true,
  },
  workspaces: {
    id: 'workspaces',
    label: 'Workspaces',
    icon: Folder,
    component: WorkspacesSettings,
    category: 'organization',
  },
  billing: {
    id: 'billing',
    label: 'Billing & Plans',
    icon: CreditCard,
    component: BillingSettings,
    category: 'organization',
  },
};

export const settingsCategories: SettingsCategoryMeta[] = [
  {
    id: 'personal',
    label: 'Personal',
    sections: ['account', 'appearance', 'privacy'],
  },
  {
    id: 'workflow',
    label: 'Workflow',
    sections: ['defaults', 'keyboard', 'models', 'workflows', 'cost-usage'],
  },
  {
    id: 'organization',
    label: 'Organization',
    sections: ['workspaces', 'billing'],
  },
];

export const defaultSettingsSection: SettingsSectionId = 'account';
