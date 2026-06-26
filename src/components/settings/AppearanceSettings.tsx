/**
 * Appearance settings — theme, accent color, font scale, reduce motion, code syntax theme.
 */
import { SettingSection } from './shared/SettingSection';
import { SettingRow } from './shared/SettingRow';
import { ResetSection } from './shared/ResetSection';
import { SettingsPageHeader } from './shared/SettingsPageHeader';
import { ColorPicker } from './shared/ColorPicker';
import { Switch } from '@/components/ui/Switch';
import { Select } from '@/components/ui/Select';
import { SelectableCard } from '@/components/ui/SelectableCard';
import { Badge } from '@/components/ui/Badge';
import { Slider } from '@/components/ui/Slider';
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
      <SettingsPageHeader
        title="Appearance"
        description="Customize how Superhive looks and feels."
      />

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
            <ColorPicker
              value={appearance.accentColor}
              onChange={(v) => save('accentColor', v)}
              label="Accent color"
            />
          }
        />
      </SettingSection>

      <SettingSection title="Typography">
        <SettingRow
          label="Font scale"
          description="Adjust the base font size. 1.0 = default, 1.1 = 10% larger, 0.9 = 10% smaller."
          control={
            <div className="flex items-center gap-3 w-72">
              <Slider
                value={[appearance.fontScale]}
                min={0.8}
                max={1.3}
                step={0.05}
                onValueChange={([v = appearance.fontScale]) => save('fontScale', v)}
                aria-label="Font scale"
                className="flex-1"
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
            <Switch
              checked={appearance.reduceMotion}
              onCheckedChange={(val) => save('reduceMotion', val)}
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
