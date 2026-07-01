/**
 * Appearance settings — visual theme picker with live previews + markdown style preview.
 * Production-grade. Fully auto-saved with toast feedback.
 */
import { Download, Upload, ChevronDown, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/DropdownMenu';
import { SettingsPageHeader } from './shared/SettingsPageHeader';
import { ResetSection } from './shared/ResetSection';
import { ShortcutHint } from '@/components/shortcuts';
import { useSettings } from '@/lib/settings-context';
import { useToast } from '@/lib/toast-context';
import { themeStore } from '@/data/themes';
import { STROKE_WIDTH } from '@/lib/constants';

type CodeThemeToken = { id: string; label: string; bg: string; text: string };

const CODE_SYNTAX_THEMES: CodeThemeToken[] = [
  { id: 'github-dark',    label: 'GitHub Dark',    bg: '#0d1117', text: '#e6edf3' },
  { id: 'github-light',   label: 'GitHub Light',   bg: '#f6f8fa', text: '#24292f' },
  { id: 'monokai',        label: 'Monokai',        bg: '#272822', text: '#f8f8f2' },
  { id: 'dracula',        label: 'Dracula',        bg: '#282a36', text: '#f8f8f2' },
  { id: 'nord',           label: 'Nord',           bg: '#2e3440', text: '#eceff4' },
  { id: 'solarized-dark', label: 'Solarized Dark', bg: '#002b36', text: '#839496' },
];

function themeAccent(themeId: string): string {
  if (themeId === 'light') return '#0562EF';
  return '#5b5651';
}

function ThemePreviewCard({ themeId }: { themeId: string }) {
  const isDark = themeId !== 'light';
  return (
    <div className="flex flex-col gap-0.5 w-full rounded overflow-hidden">
      <div className="flex gap-0.5 h-7 rounded-sm overflow-hidden">
        <div className="flex-1" style={{ background: isDark ? '#151110' : '#f5f2ef' }} />
        <div className="flex-1" style={{ background: isDark ? '#2a2827' : '#ffffff' }} />
      </div>
      <div className="flex gap-0.5 h-4 rounded-sm overflow-hidden">
        <div className="flex-1" style={{ background: isDark ? '#3a3835' : '#d0cbc6' }} />
        <div className="flex-1" style={{ background: themeAccent(themeId) }} />
      </div>
    </div>
  );
}

function MarkdownPreview({ bg, text }: { bg: string; text: string }) {
  return (
    <div className="rounded-md overflow-hidden border border-border/40 mt-3">
      <div className="flex items-center px-3 py-1.5 border-b border-border/40 bg-secondary/50">
        <span className="text-[9px] font-fustat uppercase tracking-wider text-muted-foreground/60">
          Preview
        </span>
      </div>
      <pre
        className="p-3 text-[11px] font-fustat overflow-x-auto leading-relaxed whitespace-pre-wrap"
        style={{ background: bg, color: text }}
      >
        {`const greet = () => 'hello world'
return greet()`}
      </pre>
    </div>
  );
}

function MarkdownStyleSelect({ onChange }: { onChange: (id: string) => void }) {
  const { settings } = useSettings();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center w-full rounded-md border border-border/60 bg-input px-3 h-10 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          <span className="flex-1 text-left truncate">
            {CODE_SYNTAX_THEMES.find(t => t.id === settings.appearance.codeSyntaxTheme)?.label ?? 'Default'}
          </span>
          <ChevronDown size={13} strokeWidth={STROKE_WIDTH} className="opacity-50 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[var(--radix-dropdown-menu-trigger-width)]"
      >
        <DropdownMenuRadioGroup
          value={settings.appearance.codeSyntaxTheme}
          onValueChange={onChange}
        >
          {CODE_SYNTAX_THEMES.map(({ id, label, bg }) => (
            <DropdownMenuRadioItem key={id} value={id} className="gap-2">
              <span
                className="size-3 rounded-sm shrink-0 border border-border/40"
                style={{ background: bg }}
              />
              <span className="flex-1">{label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Appearance settings page — theme picker with visual previews + markdown style.
 */
export function AppearanceSettings() {
  const { settings, update } = useSettings();
  const toast = useToast();
  const themes = themeStore.themes;
  const currentThemeId = settings.appearance.theme;

  const handleThemeChange = (id: string) => {
    update('appearance', { theme: id });
    const selected = themes.find(t => t.id === id);
    toast({ title: `Theme: ${selected?.name ?? id}` });
  };

  const handleMarkdownChange = (id: string) => {
    update('appearance', { codeSyntaxTheme: id });
    const selected = CODE_SYNTAX_THEMES.find(t => t.id === id);
    toast({ title: `Markdown: ${selected?.label ?? id}` });
  };

  const currentCodeTheme =
    CODE_SYNTAX_THEMES.find(t => t.id === settings.appearance.codeSyntaxTheme)
      ?? CODE_SYNTAX_THEMES[0]!;

  return (
    <div className="flex flex-col gap-8">
      <SettingsPageHeader
        title="Appearance"
        description="Customize how Superhive looks and feels on your device."
        action={
          <div className="flex items-center gap-1.5 rounded-md border border-border/40 bg-card/50 px-2.5 py-1.5 mt-1">
            <ShortcutHint shortcutId="settings.open" compact />
          </div>
        }
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
                  <Download size={13} strokeWidth={STROKE_WIDTH} />
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
                  <Upload size={13} strokeWidth={STROKE_WIDTH} />
                  Import
                </Button>
              </div>
            </div>

          </CardContent>
        </Card>
      </section>

      {/* Content display */}
      <section>
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-foreground">Content display</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Rendering style for code blocks throughout the app.
          </p>
        </div>
        <Card className="bg-card border border-border/40 rounded-xl">
          <CardContent className="p-5 flex flex-col">
            <div className="mb-3">
              <span className="text-sm font-medium text-foreground">Markdown style</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Controls how code blocks appear in chat and messages.
              </p>
            </div>
            <MarkdownStyleSelect onChange={handleMarkdownChange} />
            <MarkdownPreview bg={currentCodeTheme.bg} text={currentCodeTheme.text} />
          </CardContent>
        </Card>
      </section>

      <div className="flex justify-end">
        <ResetSection domain="appearance" />
      </div>
    </div>
  );
}