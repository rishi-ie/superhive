/**
 * Appearance settings — theme, custom themes, and markdown style.
 * Minimal & clean. Three options, no clutter.
 */
import { Download, Upload, ChevronDown, Circle, Type } from 'lucide-react';
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
import { useSettings } from '@/lib/settings-context';
import { useToast } from '@/lib/toast-context';
import { themeStore } from '@/data/themes';
import { STROKE_WIDTH } from '@/lib/constants';

const CODE_SYNTAX_THEMES = [
  { id: 'github-dark',    label: 'GitHub Dark'     },
  { id: 'github-light',   label: 'GitHub Light'    },
  { id: 'monokai',        label: 'Monokai'         },
  { id: 'dracula',        label: 'Dracula'         },
  { id: 'nord',           label: 'Nord'            },
  { id: 'solarized-dark', label: 'Solarized Dark'  },
];

function themeAccent(themeId: string): string {
  const map: Record<string, string> = {
    dark:   '#2a2827',
    light:  '#d0cbc6',
    system: '#888888',
  };
  return map[themeId] ?? '#5b5651';
}

function ThemeSelect() {
  const { settings, update } = useSettings();
  const toast = useToast();
  const themes = themeStore.themes;
  const currentTheme = themes.find(t => t.id === settings.appearance.theme);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-md border border-border/60 bg-input px-3 h-9 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-48 shrink-0"
        >
          <Circle
            size={9}
            fill={themeAccent(settings.appearance.theme)}
            strokeWidth={0}
          />
          <Type size={12} strokeWidth={STROKE_WIDTH} className="text-muted-foreground" />
          <span className="flex-1 text-left truncate">
            {currentTheme?.name ?? 'Default'}
          </span>
          <ChevronDown size={13} strokeWidth={STROKE_WIDTH} className="opacity-50 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuRadioGroup
          value={settings.appearance.theme}
          onValueChange={(v) => {
            update('appearance', { theme: v });
            const selected = themes.find(t => t.id === v);
            toast({ title: selected?.name ?? v });
          }}
        >
          {themes.map((t) => (
            <DropdownMenuRadioItem key={t.id} value={t.id} className="gap-2">
              <Circle
                size={9}
                fill={themeAccent(t.id)}
                strokeWidth={0}
                className="shrink-0"
              />
              <span className="flex-1 truncate">{t.name}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MarkdownStyleSelect() {
  const { settings, update } = useSettings();

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
          onValueChange={(v) => update('appearance', { codeSyntaxTheme: v })}
        >
          {CODE_SYNTAX_THEMES.map(({ id, label }) => (
            <DropdownMenuRadioItem key={id} value={id}>
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Appearance settings page — customize the look and feel of Superhive.
 */
export function AppearanceSettings() {
  const toast = useToast();

  return (
    <div className="flex flex-col gap-8">
      <SettingsPageHeader
        title="Appearance"
        description="Customize how Superhive looks and feels on your device."
      />

      <Card className="bg-card border border-border/40 rounded-xl">
        <CardContent className="p-4 flex flex-col">

          <div className="flex items-center justify-between gap-4 py-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">Theme</span>
              <span className="text-xs text-muted-foreground">
                Pick a theme or follow your system appearance.
              </span>
            </div>
            <ThemeSelect />
          </div>

          <div className="border-t border-border/40" />

          <div className="flex items-center justify-between gap-4 py-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">Custom themes</span>
              <span className="text-xs text-muted-foreground">
                Import a theme file or grab a starter to edit.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 text-xs gap-1.5"
                onClick={() => {
                  console.warn('[TODO] download starter theme');
                  toast({ title: 'Starter download coming soon', type: 'info' });
                }}
              >
                <Download size={13} strokeWidth={STROKE_WIDTH} />
                Download starter
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 text-xs gap-1.5"
                onClick={() => {
                  console.warn('[TODO] import theme');
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

      <div>
        <div className="mb-2">
          <span className="text-sm font-medium text-foreground">Markdown style</span>
          <p className="text-xs text-muted-foreground mt-0.5">
            Rendering style for markdown files throughout the app.
          </p>
        </div>
        <MarkdownStyleSelect />
      </div>

      <div className="flex justify-end">
        <ResetSection domain="appearance" />
      </div>
    </div>
  );
}