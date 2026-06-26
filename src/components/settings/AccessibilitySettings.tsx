/**
 * Accessibility settings — reduce motion (mirrors Appearance).
 */
import { SettingSection } from './shared/SettingSection';
import { SettingRow } from './shared/SettingRow';
import { ResetSection } from './shared/ResetSection';
import { SettingsPageHeader } from './shared/SettingsPageHeader';
import { Switch } from '@/components/ui/Switch';
import { useSettings } from '@/lib/settings-context';
import { useToast } from '@/lib/toast-context';

/**
 * Accessibility settings page — configure accessibility and motion preferences.
 */
export function AccessibilitySettings() {
  const { settings, update } = useSettings();
  const toast = useToast();

  const reduceMotion = settings.accessibility.reduceMotion;

  const toggle = (val: boolean) => {
    update('accessibility', { reduceMotion: val });
    toast({ title: val ? 'Motion reduced' : 'Motion enabled' });
  };

  return (
    <div className="flex flex-col">
      <SettingsPageHeader
        title="Accessibility"
        description="Adjust settings to improve usability and comfort."
      />

      <SettingSection
        title="Motion"
        description="These settings affect animations and transitions throughout the app."
      >
        <SettingRow
          label="Reduce motion"
          description="Disable animations and transitions. Useful if you experience motion sensitivity or prefer a static interface."
          control={
            <Switch
              checked={reduceMotion}
              onCheckedChange={toggle}
            />
          }
        />
      </SettingSection>
      <div className="mt-6 flex justify-end">
        <ResetSection domain="accessibility" />
      </div>
    </div>
  );
}
