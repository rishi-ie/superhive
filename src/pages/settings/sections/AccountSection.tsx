import * as React from "react";
import { Avatar, AvatarFallback, AvatarBadge } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SETTINGS_PREVIEW_ACCOUNT } from "@/lib/settings-preview";
import { SettingsDivider, SettingsPanel, SettingsRow } from "../SettingsPrimitives";
import { PreviewNotice } from "./MockPrimitives";

export function AccountSection() {
  const [name, setName] = React.useState<string>(SETTINGS_PREVIEW_ACCOUNT.name);
  const [email, setEmail] = React.useState<string>(SETTINGS_PREVIEW_ACCOUNT.email);
  const [notice, setNotice] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col gap-12">
      <PreviewNotice />

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-medium tracking-tight text-foreground">Profile</h2>
        <SettingsPanel>
          <SettingsRow title="Profile photo" description="Shown in your Superhive workspace.">
            <div className="flex items-center gap-2">
              <Avatar size="lg">
                <AvatarFallback>{SETTINGS_PREVIEW_ACCOUNT.initials}</AvatarFallback>
                <AvatarBadge />
              </Avatar>
              <Button variant="outline" size="sm" onClick={() => setNotice("Photo editing is a preview action.")}>Edit</Button>
            </div>
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="Display name">
            <Input aria-label="Display name" className="w-52" value={name} onChange={(event) => setName(event.target.value)} />
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="Email address">
            <Input aria-label="Email address" className="w-52" value={email} onChange={(event) => setEmail(event.target.value)} />
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="Account status" description="Your plan is active and renews automatically.">
            <Badge>{SETTINGS_PREVIEW_ACCOUNT.plan}</Badge>
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="Sign-in method" description="Email and password">
            <Button variant="outline" size="sm" onClick={() => setNotice("Sign-in management is a preview action.")}>Change</Button>
          </SettingsRow>
        </SettingsPanel>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-medium tracking-tight text-foreground">Security</h2>
        <SettingsPanel>
          <SettingsRow title="This Mac" description="Current session · macOS">
            <Badge variant="secondary">Current</Badge>
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="Other devices" description="2 signed-in sessions">
            <Button variant="outline" size="sm" onClick={() => setNotice("Other sessions would be signed out after account support is connected.")}>Sign out</Button>
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="All devices" description="Sign out everywhere except this Mac.">
            <Button variant="outline" size="sm" onClick={() => setNotice("Sign-out is disabled in this preview.")}>Sign out all</Button>
          </SettingsRow>
        </SettingsPanel>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-medium tracking-tight text-foreground">Your data</h2>
        <SettingsPanel>
          <SettingsRow title="Export account data" description="Download a copy of account information and settings.">
            <Button variant="outline" size="sm" onClick={() => setNotice("Account exports are a preview action.")}>Export</Button>
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="Delete account" description="Permanently remove your cloud account and billing profile.">
            <Button variant="destructive" size="sm" onClick={() => setNotice("Account deletion is disabled in this preview.")}>Delete account</Button>
          </SettingsRow>
        </SettingsPanel>
      </section>

      {notice ? <PreviewNotice>{notice}</PreviewNotice> : null}
    </div>
  );
}
