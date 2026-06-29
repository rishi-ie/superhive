/**
 * Full-screen settings view — left sidebar navigation + right content area.
 */
import { useEffect, useState } from 'react';
import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { settingsRegistry, defaultSettingsSection, type SettingsSectionId } from '@/data/config/settings-registry';

type SettingsProps = {
  onBack: () => void;
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
 * Listens for `settings:open-section` custom events dispatched from
 * keyboard shortcuts (see Dashboard.tsx) to jump to a specific section
 * without the user clicking in the sidebar.
 *
 * @param onBack - Callback to return to the main Dashboard
 */
export function Settings({ onBack }: SettingsProps) {
  const [activeSection, setActiveSection] = useState<SettingsSectionId>(defaultSettingsSection);

  useEffect(() => {
    function onOpenSection(e: Event) {
      const detail = (e as CustomEvent<{ id: SettingsSectionId }>).detail;
      if (detail?.id && settingsRegistry[detail.id]) {
        setActiveSection(detail.id);
      }
    }
    window.addEventListener('settings:open-section', onOpenSection);
    return () => window.removeEventListener('settings:open-section', onOpenSection);
  }, []);

  const PageComponent = settingsRegistry[activeSection]?.component;
  const pageLabel = settingsRegistry[activeSection]?.label ?? activeSection;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <div className="w-72 shrink-0">
        <SettingsSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onBack={onBack}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-12 pt-12 pb-24">
          {PageComponent ? <PageComponent /> : <ComingSoon id={pageLabel} />}
        </div>
      </div>
    </div>
  );
}
