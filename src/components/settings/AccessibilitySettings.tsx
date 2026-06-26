/**
 * Accessibility settings — reduce motion (mirrors Appearance).
 */
import { SettingSection } from './shared/SettingSection';
import { SettingRow } from './shared/SettingRow';
import { Toggle } from '@/components/ui/Toggle';
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
    update('appearance', { reduceMotion: val });
    toast({ title: val ? 'Motion reduced' : 'Motion enabled' });
  };

  return (
    <div className="flex flex-col">
      <div className="pb-8">
        <h2 className="text-2xl font-semibold text-foreground">Accessibility</h2>
        <p className="mt-2 text-sm text-muted-foreground">Adjust settings to improve usability and comfort.</p>
      </div>

      <SettingSection
        title="Motion"
        description="These settings affect animations and transitions throughout the app."
      >
        <SettingRow
          label="Reduce motion"
          description="Disable animations and transitions. Useful if you experience motion sensitivity or prefer a static interface. Synced with Appearance settings."
          control={
            <Toggle
              checked={reduceMotion}
              onChange={toggle}
              size="sm"
            />
          }
        />
      </SettingSection>
    </div>
  );
}
