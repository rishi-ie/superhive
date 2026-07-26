import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SettingsDivider, SettingsPanel, SettingsRow } from "../SettingsPrimitives";
import { PreviewNotice } from "./MockPrimitives";

export function UpdatesSupportSection() {
  const [automaticUpdates, setAutomaticUpdates] = React.useState(true);
  const [notice, setNotice] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col gap-12">
      <PreviewNotice />

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-medium tracking-tight text-foreground">Updates</h2>
        <SettingsPanel>
          <SettingsRow title="Superhive 0.1.8" description="You are up to date.">
            <Badge variant="secondary">Up to date</Badge>
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="Automatic update checks" description="Check for new releases when Superhive starts.">
            <Switch checked={automaticUpdates} onCheckedChange={setAutomaticUpdates} />
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="Check for updates">
            <Button variant="outline" size="sm" onClick={() => setNotice("Update checks are a preview action.")}>Check now</Button>
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="Release notes" description="See what changed in the latest release.">
            <Button variant="outline" size="sm" onClick={() => setNotice("Release notes would open in your browser.")}>View notes</Button>
          </SettingsRow>
        </SettingsPanel>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-medium tracking-tight text-foreground">Support</h2>
        <SettingsPanel>
          <SettingsRow title="Documentation" description="Guides for agents, projects, and provider setup.">
            <Button variant="outline" size="sm" onClick={() => setNotice("Documentation would open in your browser.")}>Open docs</Button>
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="Contact support" description="Share an issue with the Superhive team.">
            <Button variant="outline" size="sm" onClick={() => setNotice("Support contact is a preview action.")}>Contact</Button>
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="Diagnostic ID" description="SH-PREVIEW-7F42">
            <Button variant="outline" size="sm" onClick={() => setNotice("Diagnostic ID copied in this preview.")}>Copy</Button>
          </SettingsRow>
        </SettingsPanel>
      </section>

      {notice ? <PreviewNotice>{notice}</PreviewNotice> : null}
    </div>
  );
}
