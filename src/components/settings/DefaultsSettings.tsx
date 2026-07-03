/**
 * Defaults settings — placeholder page for app startup and display defaults.
 */
import { SettingsPageHeader } from './shared/SettingsPageHeader';

/**
 * Defaults settings page — coming soon.
 */
export function DefaultsSettings() {
  return (
    <div className="flex flex-col">
      <SettingsPageHeader
        title="Defaults"
        description="Configure app startup and display defaults."
      />
      <p className="text-sm text-muted-foreground py-8 text-center">
        Defaults settings coming soon.
      </p>
    </div>
  );
}
