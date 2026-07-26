import * as React from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SettingsDivider, SettingsPanel, SettingsRow } from "../SettingsPrimitives";
import { PreviewNotice } from "./MockPrimitives";

export function PrivacyDataSection() {
  const [diagnostics, setDiagnostics] = React.useState(false);
  const [attribution, setAttribution] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col gap-12">
      <PreviewNotice />

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-medium tracking-tight text-foreground">Telemetry</h2>
        <SettingsPanel footer={<span className="text-xs text-muted-foreground">Diagnostics never include your source code or prompt contents.</span>}>
          <SettingsRow title="Anonymous diagnostics" description="Help improve reliability with anonymous app and crash information.">
            <Switch checked={diagnostics} onCheckedChange={setDiagnostics} />
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="Provider attribution" description="Allow Pi to send optional installation and provider-attribution telemetry.">
            <Switch checked={attribution} onCheckedChange={setAttribution} />
          </SettingsRow>
        </SettingsPanel>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-medium tracking-tight text-foreground">Local data</h2>
        <SettingsPanel>
          <SettingsRow title="Superhive data" description="View the local app data used by this workspace.">
            <Button variant="outline" size="sm" onClick={() => setNotice("Opening local data is a preview action.")}>Reveal</Button>
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="Clear cached data" description="Remove local caches without deleting projects or agent workspaces.">
            <Button variant="outline" size="sm" onClick={() => setNotice("Cache clearing is disabled in this preview.")}>Clear cache</Button>
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="Export diagnostics" description="Create a support bundle with app diagnostics only.">
            <Button variant="outline" size="sm" onClick={() => setNotice("Diagnostics export is a preview action.")}>Export</Button>
          </SettingsRow>
        </SettingsPanel>
      </section>

      {notice ? <PreviewNotice>{notice}</PreviewNotice> : null}
    </div>
  );
}
