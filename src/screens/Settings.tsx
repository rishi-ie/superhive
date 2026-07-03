/**
 * Full-screen settings view — left sidebar navigation + right content area.
 */
import { useState } from 'react';
import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { settingsRegistry, defaultSettingsSection, type SettingsSectionId } from '@/data/config/settings-registry';

/**
 * Full-screen settings view with sidebar navigation.
 */
export function Settings() {
  const [activeSection, setActiveSection] = useState<SettingsSectionId>(defaultSettingsSection);

  const PageComponent = settingsRegistry[activeSection]?.component;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <div className="w-72 shrink-0">
        <SettingsSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
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
