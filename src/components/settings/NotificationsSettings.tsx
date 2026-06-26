/**
 * Notifications settings — quiet hours configuration.
 */
import { useState } from 'react';
import { SettingSection } from './shared/SettingSection';
import { SettingRow } from './shared/SettingRow';
import { ResetSection } from './shared/ResetSection';
import { SettingsPageHeader } from './shared/SettingsPageHeader';
import { SettingsSaveBar } from './shared/SettingsSaveBar';
import { Switch } from '@/components/ui/Switch';
import { TextInput } from '@/components/ui/TextInput';
import { Label } from '@/components/ui/Label';
import { Pill } from '@/components/ui/Pill';
import { useSettings } from '@/lib/settings-context';
import { useToast } from '@/lib/toast-context';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Notifications settings page — configure quiet hours for do-not-disturb periods.
 */
export function NotificationsSettings() {
  const { settings, update } = useSettings();
  const toast = useToast();
  const qh = settings.notifications.quietHours;

  const [enabled, setEnabled] = useState(qh.enabled);
  const [start, setStart] = useState(qh.start);
  const [end, setEnd] = useState(qh.end);
  const [days, setDays] = useState<number[]>(qh.days);

  const toggleDay = (d: number) => {
    setDays(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort()
    );
  };

  const save = () => {
    update('notifications', {
      quietHours: { enabled, start, end, days },
    });
    toast({ title: 'Notification settings saved' });
  };

  const discardChanges = () => {
    setEnabled(qh.enabled);
    setStart(qh.start);
    setEnd(qh.end);
    setDays(qh.days);
  };

  const isDirty =
    enabled !== qh.enabled ||
    start !== qh.start ||
    end !== qh.end ||
    JSON.stringify([...days].sort()) !== JSON.stringify([...qh.days].sort());

  return (
    <div className="flex flex-col">
      <SettingsPageHeader
        title="Notifications"
        description="Control when you receive notifications from Superhive."
      />

      <SettingSection
        title="Quiet Hours"
        description="Silence all notifications during a scheduled time window. Useful for nights or focus time."
      >
        <SettingRow
          label="Enable quiet hours"
          description="When active, notifications are silenced during the scheduled window."
          control={
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          }
        />
        <SettingRow
          label="Window"
          description="Time range during which notifications are silenced. Can wrap past midnight."
          control={
            <div className="flex items-center gap-2">
              <Label htmlFor="qh-start" className="sr-only">Quiet hours start</Label>
              <TextInput
                id="qh-start"
                type="time"
                value={start}
                onChange={e => setStart(e.target.value)}
                disabled={!enabled}
                className="w-32"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Label htmlFor="qh-end" className="sr-only">Quiet hours end</Label>
              <TextInput
                id="qh-end"
                type="time"
                value={end}
                onChange={e => setEnd(e.target.value)}
                disabled={!enabled}
                className="w-32"
              />
            </div>
          }
        />
        <SettingRow
          label="Active days"
          description="Which days of the week the quiet hours window applies to."
          control={
            <div className="flex gap-1.5">
              {DAYS.map((day, i) => {
                const active = days.includes(i);
                return (
                  <Pill
                    key={day}
                    active={active}
                    disabled={!enabled}
                    onClick={() => toggleDay(i)}
                    size="sm"
                    className="w-8 justify-center"
                  >
                    {day.slice(0, 2)}
                  </Pill>
                );
              })}
            </div>
          }
        />
      </SettingSection>

      <SettingsSaveBar isDirty={isDirty} onDiscard={discardChanges} onSave={save} />
      <div className="mt-6 flex justify-end">
        <ResetSection domain="notifications" />
      </div>
    </div>
  );
}
