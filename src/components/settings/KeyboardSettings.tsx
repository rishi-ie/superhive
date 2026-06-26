/**
 * Keyboard shortcuts — static list grouped by category (Global / Tabs / Right Panel / Tickets & Channels).
 */
import { SettingSection } from './shared/SettingSection';
import { useSettings } from '@/lib/settings-context';

/**
 * Keyboard shortcuts page — view-only reference of all available shortcuts.
 */
export function KeyboardSettings() {
  const { settings } = useSettings();
  const { groups } = settings.keyboard;

  return (
    <div className="flex flex-col">
      <div className="pb-8">
        <h2 className="text-2xl font-semibold text-foreground">Keyboard Shortcuts</h2>
        <p className="mt-2 text-sm text-muted-foreground">Quick reference for all keyboard shortcuts in Superhive.</p>
      </div>

      <div className="grid grid-cols-2 gap-x-8">
        {groups.map(group => (
          <SettingSection key={group.label} title={group.label}>
            <div className="divide-y divide-border/40 border-t border-border/40">
              {group.shortcuts.map(shortcut => (
                <div key={shortcut.keys} className="flex items-center justify-between gap-4 py-2.5">
                  <span className="text-xs text-muted-foreground leading-relaxed">{shortcut.description}</span>
                  <kbd className="shrink-0 rounded border border-border bg-card px-2 py-0.5 text-xs font-mono text-foreground shadow-sm">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </SettingSection>
        ))}
      </div>
    </div>
  );
}
