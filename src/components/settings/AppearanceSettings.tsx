/**
 * Appearance settings — visual theme picker with live previews.
 * Production-grade. Fully auto-saved with toast feedback.
 */
import { Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SettingsPageHeader } from './shared/SettingsPageHeader';
import { ResetSection } from './shared/ResetSection';
import { useSettings } from '@/lib/settings-context';
import { DEFAULT_THEMES } from '@/data/config/themes';
import { useToast } from '@/lib/toast-context';
import { DARK_PALETTE } from '@/data/config/palette';

function themeAccent(themeId: string): string {
  if (themeId === 'light') return '#0562EF';
  return DARK_PALETTE.accent;
}

function ThemePreviewCard({ themeId }: { themeId: string }) {
  const isDark = themeId !== 'light';
  return (
    <div className="flex flex-col gap-0.5 w-full rounded overflow-hidden">
      <div className="flex gap-0.5 h-7 rounded-sm overflow-hidden">
        <div className="flex-1" style={{ background: isDark ? DARK_PALETTE.background : '#f5f2ef' }} />
        <div className="flex-1" style={{ background: isDark ? DARK_PALETTE.surface : '#ffffff' }} />
      </div>
      <div className="flex gap-0.5 h-4 rounded-sm overflow-hidden">
        <div className="flex-1" style={{ background: isDark ? DARK_PALETTE.border : '#d0cbc6' }} />
        <div className="flex-1" style={{ background: themeAccent(themeId) }} />
      </div>
    </div>
  );
}

/**
 * Appearance settings page — theme picker with visual previews.
 */
export function AppearanceSettings() {
  const { settings, update } = useSettings();
  const toast = useToast();
  const themes = DEFAULT_THEMES;
  const currentThemeId = settings.appearance.theme;

  const handleThemeChange = (id: string) => {
    update('appearance', { theme: id });
    const selected = themes.find(t => t.id === id);
    toast({ title: `Theme: ${selected?.name ?? id}` });
  };

  return (
    <div className="flex flex-col gap-8">
      <SettingsPageHeader
        title="Appearance"
        description="Customize how Superhive looks and feels on your device."
      />

      {/* Application theme */}
      <section>
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-foreground">Application theme</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Visual style that drives colors, surfaces, and contrast across the app.
          </p>
        </div>
        <Card className="bg-card border border-border/40 rounded-xl">
          <CardContent className="p-5 flex flex-col gap-5">
            {/* Theme grid */}
            <div>
              <div className="mb-3">
                <span className="text-sm font-medium text-foreground">Theme</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pick a theme or follow your system appearance.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {themes.map(t => {
                  const isActive = t.id === currentThemeId;
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleThemeChange(t.id)}
                      className={[
                        'flex flex-col gap-2.5 rounded-lg border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                        isActive
                          ? 'border-highlight bg-highlight-match/20 ring-1 ring-highlight'
                          : 'border-border/60 hover:border-border bg-card hover:bg-tertiary/30',
                      ].join(' ')}
                    >
                      <ThemePreviewCard themeId={t.id} />
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground leading-tight">{t.name}</span>
                        {isActive && (
                          <span className="size-4 rounded-full bg-highlight flex items-center justify-center shrink-0">
                            <Check size={10} strokeWidth={2.5} className="text-highlight-foreground" />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-border/40" />

            {/* Custom themes */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">Custom themes</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
                    Coming soon
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Import a theme file or grab a starter to edit.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 text-xs gap-1.5 opacity-70"
                  onClick={() => {
                    toast({ title: 'Starter download coming soon', type: 'info' });
                  }}
                >
                  Download starter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 text-xs gap-1.5 opacity-70"
                  onClick={() => {
                    toast({ title: 'Theme import coming soon', type: 'info' });
                  }}
                >
                  Import
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="flex justify-end">
        <ResetSection domain="appearance" />
      </div>
    </div>
  );
}
