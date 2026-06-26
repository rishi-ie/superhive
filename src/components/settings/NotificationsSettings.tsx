/**
 * Notifications settings — quiet hours configuration.
 */
import { useState } from 'react';
import { SettingSection } from './shared/SettingSection';
import { SettingRow } from './shared/SettingRow';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { useSettings } from '@/lib/settings-context';
import { useToast } from '@/lib/toast-context';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const inputClass =
  'rounded-md border border-border bg-input px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed';

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
      <div className="pb-8">
        <h2 className="text-2xl font-semibold text-foreground">Notifications</h2>
        <p className="mt-2 text-sm text-muted-foreground">Control when you receive notifications from Superhive.</p>
      </div>

      <SettingSection
        title="Quiet Hours"
        description="Silence all notifications during a scheduled time window. Useful for nights or focus time."
      >
        <SettingRow
          label="Enable quiet hours"
          description="When active, notifications are silenced during the scheduled window."
          control={
            <Toggle
              checked={enabled}
              onChange={setEnabled}
              size="sm"
            />
          }
        />
        <SettingRow
          label="Window"
          description="Time range during which notifications are silenced. Can wrap past midnight."
          control={
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={start}
                onChange={e => setStart(e.target.value)}
                disabled={!enabled}
                className={`${inputClass} w-32`}
                aria-label="Quiet hours start"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <input
                type="time"
                value={end}
                onChange={e => setEnd(e.target.value)}
                disabled={!enabled}
                className={`${inputClass} w-32`}
                aria-label="Quiet hours end"
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
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(i)}
                    disabled={!enabled}
                    aria-pressed={active}
                    className={`size-9 rounded-md text-[10px] font-medium border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-40 disabled:cursor-not-allowed ${
                      active
                        ? 'bg-chart-1/15 border-chart-1/40 text-chart-1'
                        : 'border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/40'
                    }`}
                  >
                    {day.slice(0, 2)}
                  </button>
                );
              })}
            </div>
          }
        />
      </SettingSection>

      {isDirty && (
        <div className="sticky bottom-0 mt-8 -mx-4 px-4 py-3 bg-sidebar/95 backdrop-blur border-t border-border flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">Unsaved changes</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={discardChanges}>
              Discard
            </Button>
            <Button variant="solid" size="sm" onClick={save}>
              Save changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
