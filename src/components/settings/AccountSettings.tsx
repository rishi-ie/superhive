/**
 * Account settings — name, email, username, avatar, connected accounts, workspace, timezone, sign out.
 */
import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { TextInput } from '@/components/ui/TextInput';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { SettingSection } from './shared/SettingSection';
import { SettingRow } from './shared/SettingRow';
import { ResetSection } from './shared/ResetSection';
import { useSettings } from '@/lib/settings-context';
import { useToast } from '@/lib/toast-context';
import { GitBranch, Globe, Apple } from 'lucide-react';

const PROVIDER_ICONS = {
  github: GitBranch,
  google: Globe,
  apple: Apple,
};

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney',
  'UTC',
];


/**
 * Account settings page — manage your identity, connected accounts, and preferences.
 */
export function AccountSettings() {
  const { settings, update } = useSettings();
  const toast = useToast();
  const [avatarHovered, setAvatarHovered] = useState(false);

  const acc = settings.account;

  const [name, setName] = useState(acc.name);
  const [email, setEmail] = useState(acc.email);
  const [username, setUsername] = useState(acc.username);
  const [timezone, setTimezone] = useState(acc.timezone);
  const [defaultWorkspaceId, setDefaultWorkspaceId] = useState(acc.defaultWorkspaceId ?? '');

  const [nameDirty, setNameDirty] = useState(false);
  const [emailDirty, setEmailDirty] = useState(false);
  const [usernameDirty, setUsernameDirty] = useState(false);
  const [timezoneDirty, setTimezoneDirty] = useState(false);
  const [workspaceDirty, setWorkspaceDirty] = useState(false);

  const anyDirty = nameDirty || emailDirty || usernameDirty || timezoneDirty || workspaceDirty;

  const saveAccount = () => {
    update('account', {
      name: name.trim() || 'Your Name',
      email: email.trim() || 'you@example.com',
      username: username.trim() || 'you',
      timezone,
      defaultWorkspaceId: defaultWorkspaceId || null,
    });
    setNameDirty(false);
    setEmailDirty(false);
    setUsernameDirty(false);
    setTimezoneDirty(false);
    setWorkspaceDirty(false);
    toast({ title: 'Account settings saved' });
  };

  const discardChanges = () => {
    setName(acc.name); setNameDirty(false);
    setEmail(acc.email); setEmailDirty(false);
    setUsername(acc.username); setUsernameDirty(false);
    setTimezone(acc.timezone); setTimezoneDirty(false);
    setDefaultWorkspaceId(acc.defaultWorkspaceId ?? ''); setWorkspaceDirty(false);
  };

  const handleSignOut = () => {
    toast({ title: 'Signed out of this device' });
  };

  return (
    <div className="flex flex-col">
      <div className="pb-8">
        <h2 className="text-2xl font-semibold text-foreground">Account</h2>
        <p className="mt-2 text-sm text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      {/* Profile — avatar row + identity rows */}
      <SettingSection title="Profile">
        <SettingRow
          label="Avatar"
          description="Recommended size 256x256. JPG, PNG, or GIF."
          control={
            <div
              className="relative"
              onMouseEnter={() => setAvatarHovered(true)}
              onMouseLeave={() => setAvatarHovered(false)}
            >
              <Avatar size="xl" name={name} className="cursor-pointer" />
              {avatarHovered && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 text-[10px] text-foreground font-medium">
                  Change
                </div>
              )}
            </div>
          }
        />
        <SettingRow
          label="Display name"
          description="How you appear across Superhive — in mentions, activity feed, and notifications."
          control={
            <TextInput
              value={name}
              onChange={e => { setName(e.target.value); setNameDirty(true); }}
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
                value={username}
                onChange={e => { setUsername(e.target.value); setUsernameDirty(true); }}
                className="w-48"
              />
            </div>
          }
        />
      </SettingSection>

      {/* Contact */}
      <SettingSection title="Contact">
        <SettingRow
          label="Email address"
          description="Used for sign-in, notifications, and billing receipts."
          control={
            <TextInput
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setEmailDirty(true); }}
              className="w-80"
            />
          }
        />
        <SettingRow
          label="Timezone"
          description="Used to display timestamps and schedule quiet hours correctly."
          control={
            <Select
              value={timezone}
              options={TIMEZONES.map(tz => ({ value: tz, label: tz }))}
              onChange={val => { setTimezone(val); setTimezoneDirty(true); }}
              className="w-56"
            />
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
              value={defaultWorkspaceId}
              onChange={e => { setDefaultWorkspaceId(e.target.value); setWorkspaceDirty(true); }}
              placeholder="Last opened"
              className="w-56"
            />
          }
        />
        <SettingRow
          label="Profile accent color"
          description="Your personal highlight color used across your avatar and activity indicators."
          control={
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.appearance.accentColor}
                onChange={e => update('appearance', { accentColor: e.target.value })}
                className="size-8 rounded-md cursor-pointer border border-border bg-transparent"
                aria-label="Pick accent color"
              />
              <TextInput
                value={settings.appearance.accentColor}
                onChange={e => update('appearance', { accentColor: e.target.value })}
                className="w-28"
              />
            </div>
          }
        />
      </SettingSection>

      {/* Connected accounts */}
      <SettingSection
        title="Connected accounts"
        description="Link your external accounts for easier sign-in."
      >
        <div className="border border-border/40 rounded-md divide-y divide-border/40">
          {acc.connectedAccounts.map(account => {
            const Icon = PROVIDER_ICONS[account.provider];
            return (
              <div key={account.provider} className="flex items-center justify-between gap-6 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-8 rounded-md bg-card border border-border/60 flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-muted-foreground" />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium text-foreground">{account.label}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {account.connected ? account.email ?? 'Connected' : 'Not connected'}
                    </span>
                  </div>
                </div>
                <Toggle
                  checked={account.connected}
                  onChange={() => {
                    update('account', {
                      connectedAccounts: acc.connectedAccounts.map(a =>
                        a.provider === account.provider
                          ? { ...a, connected: !a.connected }
                          : a
                      ),
                    });
                    toast({ title: account.connected ? `${account.label} disconnected` : `${account.label} connected` });
                  }}
                  size="sm"
                />
              </div>
            );
          })}
        </div>
      </SettingSection>

      {/* Sticky save bar */}
      {anyDirty && (
        <div className="sticky bottom-0 mt-8 -mx-4 px-4 py-3 bg-sidebar/95 backdrop-blur border-t border-border flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">Unsaved changes</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={discardChanges}>
              Discard
            </Button>
            <Button variant="default" size="sm" onClick={saveAccount}>
              Save changes
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <ResetSection domain="account" />
      </div>

      {/* Session / sign out */}
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
    </div>
  );
}
