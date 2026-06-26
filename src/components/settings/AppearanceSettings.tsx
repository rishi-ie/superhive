/**
 * Appearance settings — theme, accent color, font scale, reduce motion, code syntax theme.
 */
import { SettingSection } from './shared/SettingSection';
import { SettingRow } from './shared/SettingRow';
import { ResetSection } from './shared/ResetSection';
import { Toggle } from '@/components/ui/Toggle';
import { Select } from '@/components/ui/Select';
import { SelectableCard } from '@/components/ui/SelectableCard';
import { Badge } from '@/components/ui/Badge';
import { useSettings } from '@/lib/settings-context';
import { useToast } from '@/lib/toast-context';
import { DEFAULT_THEMES } from '@/lib/settings-context';
import type { ThemeId } from '@/data/settings/interface';

const CODE_SYNTAX_THEMES = [
  { id: 'github-dark', label: 'GitHub Dark' },
  { id: 'github-light', label: 'GitHub Light' },
  { id: 'monokai', label: 'Monokai' },
  { id: 'dracula', label: 'Dracula' },
  { id: 'nord', label: 'Nord' },
  { id: 'solarized-dark', label: 'Solarized Dark' },
];


function ThemeSwatch({ themeId }: { themeId: string }) {
  const isDark = themeId === 'dark';
  const isLight = themeId === 'light';
  return (
    <div
      className="size-12 rounded-md border border-border/60 shadow-sm"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #151110 50%, #2a2827 50%)'
          : isLight
          ? 'linear-gradient(135deg, #f5f2ef 50%, #d0cbc6 50%)'
          : 'linear-gradient(135deg, #151110 50%, #f5f2ef 50%)',
      }}
    />
  );
}

/**
 * Appearance settings page — customize the look and feel of Superhive.
 */
export function AppearanceSettings() {
  const { settings, update } = useSettings();
  const toast = useToast();
  const { appearance } = settings;

  const save = <K extends keyof typeof appearance>(key: K, value: typeof appearance[K]) => {
    update('appearance', { [key]: value });
  };

  return (
    <div className="flex flex-col">
      <div className="pb-8">
        <h2 className="text-2xl font-semibold text-foreground">Appearance</h2>
        <p className="mt-2 text-sm text-muted-foreground">Customize how Superhive looks and feels.</p>
      </div>

      <SettingSection
        title="Theme"
        description="Choose a color theme for Superhive. System follows your OS preference."
      >
        <div className="flex flex-wrap gap-3 pt-1">
          {DEFAULT_THEMES.map(theme => {
            const isActive = appearance.theme === theme.id;
            return (
              <SelectableCard
                key={theme.id}
                title={theme.name}
                selected={isActive}
                onClick={() => { save('theme', theme.id as ThemeId); toast({ title: `Theme: ${theme.name}` }); }}
              >
                <ThemeSwatch themeId={theme.id} />
                {isActive && <Badge variant="active" className="ml-auto">Active</Badge>}
              </SelectableCard>
            );
          })}
        </div>
      </SettingSection>

      <SettingSection title="Color">
        <SettingRow
          label="Accent color"
          description="Your primary highlight color used across Superhive for emphasis and selection."
          control={
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={appearance.accentColor}
                onChange={e => save('accentColor', e.target.value)}
                className="size-8 rounded-md cursor-pointer border border-border bg-transparent"
                aria-label="Pick accent color"
              />
              <span className="text-xs text-muted-foreground font-mono w-20 uppercase tracking-wider">
                {appearance.accentColor}
              </span>
            </div>
          }
        />
      </SettingSection>

      <SettingSection title="Typography">
        <SettingRow
          label="Font scale"
          description="Adjust the base font size. 1.0 = default, 1.1 = 10% larger, 0.9 = 10% smaller."
          control={
            <div className="flex items-center gap-3 w-72">
              <input
                type="range"
                min={0.8}
                max={1.3}
                step={0.05}
                value={appearance.fontScale}
                aria-label="Font scale"
                aria-valuemin={0.8}
                aria-valuemax={1.3}
                aria-valuenow={appearance.fontScale}
                onChange={e => save('fontScale', parseFloat(e.target.value))}
                className="flex-1 accent-chart-1 h-1"
              />
              <span className="text-xs font-fustat text-foreground w-12 text-right tabular-nums">
                {appearance.fontScale.toFixed(2)}x
              </span>
            </div>
          }
        />
        <SettingRow
          label="Code syntax theme"
          description="Color theme used for code blocks in chat and commit messages."
          control={
            <Select
              value={appearance.codeSyntaxTheme}
              options={CODE_SYNTAX_THEMES.map(t => ({ value: t.id, label: t.label }))}
              onChange={val => save('codeSyntaxTheme', val)}
              className="w-48"
            />
          }
        />
      </SettingSection>

      <SettingSection title="Motion">
        <SettingRow
          label="Reduce motion"
          description="Disable animations and transitions throughout the interface. Improves accessibility and performance."
          control={
            <Toggle
              checked={appearance.reduceMotion}
              onChange={(val: boolean) => save('reduceMotion', val)}
              size="sm"
            />
          }
        />
      </SettingSection>

      <div className="mt-6 flex justify-end">
        <ResetSection domain="appearance" />
      </div>
    </div>
  );
}
