import { useState } from 'react';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';

type AccountSettingsProps = {
  name: string;
  email: string;
};

export function AccountSettings({ name, email }: AccountSettingsProps) {
  const [avatarHovered, setAvatarHovered] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Account</h2>
        <p className="mt-2 text-sm text-muted-foreground">Manage your account settings</p>
      </div>

      <div className="flex items-start justify-between gap-8">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">Avatar</span>
          <span className="text-xs text-muted-foreground">Recommended size 256x256.</span>
        </div>
        <div
          className="relative"
          onMouseEnter={() => setAvatarHovered(true)}
          onMouseLeave={() => setAvatarHovered(false)}
        >
          <Avatar size="xl" fallback="?" className="cursor-pointer" />
          {avatarHovered && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 text-xs text-foreground font-medium">
              Change
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-8">
        <label className="text-sm font-medium text-foreground">Name</label>
        <TextInput value={name} className="w-80" />
      </div>

      <div className="flex items-center justify-between gap-8">
        <label className="text-sm font-medium text-foreground">Email</label>
        <TextInput type="email" value={email} className="w-80" />
      </div>

      <div className="flex items-start justify-between gap-8 border-t border-sidebar-border pt-6">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">Sign out of this device</span>
          <span className="text-xs text-muted-foreground">
            You'll need to sign in again to use Superhive on this device.
          </span>
        </div>
        <Button variant="outline" size="md" className="shrink-0 mt-0.5">
          Sign out
        </Button>
      </div>
    </div>
  );
}
