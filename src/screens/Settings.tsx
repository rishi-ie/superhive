/**
 * Full-screen settings view — left sidebar navigation + right content area.
 */
import { useState } from 'react';
import type { ComponentType } from 'react';
import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { AccountSettings } from '@/components/settings/AccountSettings';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
import { NotificationsSettings } from '@/components/settings/NotificationsSettings';
import { PrivacySettings } from '@/components/settings/PrivacySettings';
import { AccessibilitySettings } from '@/components/settings/AccessibilitySettings';
import { DefaultsSettings } from '@/components/settings/DefaultsSettings';
import { KeyboardSettings } from '@/components/settings/KeyboardSettings';
import { ModelsSettings } from '@/components/settings/ModelsSettings';
import { WorkflowsSettings } from '@/components/settings/WorkflowsSettings';
import { CostUsageSettings } from '@/components/settings/CostUsageSettings';
import { AgentsSettings } from '@/components/settings/AgentsSettings';
import { WorkspacesSettings } from '@/components/settings/WorkspacesSettings';
import { IntegrationsSettings } from '@/components/settings/IntegrationsSettings';
import { BillingSettings } from '@/components/settings/BillingSettings';

type SettingsProps = {
  onBack: () => void;
};

const PAGES: Record<string, ComponentType> = {
  account: AccountSettings,
  appearance: AppearanceSettings,
  notifications: NotificationsSettings,
  privacy: PrivacySettings,
  accessibility: AccessibilitySettings,
  defaults: DefaultsSettings,
  keyboard: KeyboardSettings,
  models: ModelsSettings,
  workflows: WorkflowsSettings,
  'cost-usage': CostUsageSettings,
  agents: AgentsSettings,
  workspaces: WorkspacesSettings,
  integrations: IntegrationsSettings,
  billing: BillingSettings,
};

function ComingSoon({ id }: { id: string }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold text-foreground capitalize">
        {id.replace('-', ' & ')}
      </h2>
      <p className="text-sm text-muted-foreground">Coming soon.</p>
    </div>
  );
}

/**
 * Full-screen settings view with sidebar navigation.
 * @param onBack - Callback to return to the main Dashboard
 */
export function Settings({ onBack }: SettingsProps) {
  const [activeSection, setActiveSection] = useState('account');

  const PageComponent = PAGES[activeSection] ?? (() => <ComingSoon id={activeSection} />);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <div className="w-75 shrink-0">
        <SettingsSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onBack={onBack}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-12 pt-12 pb-24">
          <PageComponent />
        </div>
      </div>
    </div>
  );
}
