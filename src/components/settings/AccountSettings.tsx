/**
 * Account settings — name, username, default workspace, highlight color, sign out.
 * Auto-saves each change with a toast confirmation. No save bar.
 */
import { Avatar } from '@/components/ui/Avatar';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { SettingSection } from './shared/SettingSection';
import { SettingRow } from './shared/SettingRow';
import { ResetSection } from './shared/ResetSection';
import { SettingsPageHeader } from './shared/SettingsPageHeader';
import { ColorPicker } from './shared/ColorPicker';
import { useSettings } from '@/lib/settings-context';
import { useToast } from '@/lib/toast-context';

/**
 * Account settings page — manage your identity, default workspace, and session.
 */
export function AccountSettings() {
  const { settings, update } = useSettings();
  const toast = useToast();
  const acc = settings.account;

  const saveField = <K extends keyof typeof acc>(
    key: K,
    value: typeof acc[K],
    label: string,
  ) => {
    update('account', { [key]: value });
    toast({ title: `${label} updated` });
  };

  const handleSignOut = () => {
    toast({ title: 'Signed out of this device' });
  };

  return (
    <div className="flex flex-col">
      <SettingsPageHeader
        title="Account"
        description="Manage your account settings and preferences."
      />

      {/* Profile */}
      <SettingSection title="Profile">
        <SettingRow
          label="Avatar"
          description="Recommended size 256x256. JPG, PNG, or GIF."
          control={
            <div className="relative group">
              <Avatar size="xl" name={acc.name} className="cursor-pointer" />
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 text-[10px] text-foreground font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Change
              </div>
            </div>
          }
        />
        <SettingRow
          label="Display name"
          description="How you appear across Superhive — in mentions, activity feed, and notifications."
          control={
            <TextInput
              value={acc.name}
              onChange={e => saveField('name', e.target.value, 'Display name')}
              className="w-64"
            />
          }
        />
        <SettingRow
          label="Username"
          description="Your unique @handle for mentions and share links across Superhive."
          control={
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground">@</span>
              <TextInput
                value={acc.username}
                onChange={e => saveField('username', e.target.value, 'Username')}
                className="w-48"
              />
            </div>
          }
        />
      </SettingSection>

      {/* Preferences */}
      <SettingSection title="Preferences">
        <SettingRow
          label="Default workspace"
          description="Which workspace opens automatically when you launch Superhive. Leave blank for last-opened."
          control={
            <TextInput
              value={acc.defaultWorkspaceId ?? ''}
              placeholder="Last opened"
              onChange={e =>
                saveField(
                  'defaultWorkspaceId',
                  e.target.value || null,
                  'Default workspace',
                )
              }
              className="w-56"
            />
          }
        />
        <SettingRow
          label="Profile highlight color"
          description="Color for your selections, matches, and active link underlines. Theme controls the brand color for buttons and badges."
          control={
            <ColorPicker
              value={settings.appearance.highlightColor}
              onChange={v => update('appearance', { highlightColor: v })}
              label="Profile highlight color"
            />
          }
        />
      </SettingSection>

      {/* Session */}
      <SettingSection title="Session">
        <SettingRow
          label="Sign out of this device"
          description="You will need to sign in again to use Superhive on this device."
          control={
            <Button variant="outline" size="md" onClick={handleSignOut}>
              Sign out
            </Button>
          }
        />
      </SettingSection>

      <div className="mt-6 flex justify-end">
        <ResetSection domain="account" />
      </div>
    </div>
  );
}