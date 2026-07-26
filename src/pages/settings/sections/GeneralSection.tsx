import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import * as React from "react";
import { Segmented } from "@/components/layout/right-sidebar/primitives/Segmented";
import {
  SettingsDivider,
  SettingsPanel,
  SettingsRow,
} from "../SettingsPrimitives";
import { PreviewNotice } from "./MockPrimitives";

type FileOpenDestination = "vscode" | "system";

export function GeneralSection() {
  const [fileDestination, setFileDestination] = React.useState<FileOpenDestination>("system");
  const [preventSleep, setPreventSleep] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col gap-12">
      <PreviewNotice />

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-medium tracking-tight text-foreground">Desktop</h2>
        <SettingsPanel>
          <SettingsRow title="Default file opener" description="Choose where files and folders open by default.">
            <Segmented
              className="w-44"
              value={fileDestination}
              onValueChange={setFileDestination}
              options={[{ value: "system", label: "System" }, { value: "vscode", label: "VS Code" }]}
            />
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="Prevent sleep while running" description="Keep your computer awake while Superhive is running an agent task.">
            <Switch checked={preventSleep} onCheckedChange={setPreventSleep} aria-label="Prevent sleep while running" />
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="Superhive data folder" description="View local app data for this Mac.">
            <Button variant="outline" size="sm" onClick={() => setNotice("Revealing the data folder is a preview action.")}>Reveal</Button>
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="Diagnostic logs" description="Open local logs for troubleshooting.">
            <Button variant="outline" size="sm" onClick={() => setNotice("Opening logs is a preview action.")}>Open logs</Button>
          </SettingsRow>
        </SettingsPanel>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-medium tracking-tight text-foreground">Reset</h2>
        <SettingsPanel>
          <SettingsRow title="Reset app preferences" description="Restore visual preferences in this preview.">
            <Button variant="outline" size="sm" onClick={() => { setFileDestination("system"); setPreventSleep(false); setNotice("Preview preferences restored."); }}>Reset</Button>
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow title="Reset all mock settings" description="Restore preview controls without touching real models or providers.">
            <Button variant="destructive" size="sm" onClick={() => setNotice("Mock settings reset is a preview action.")}>Reset all</Button>
          </SettingsRow>
        </SettingsPanel>
      </section>

      {notice ? <PreviewNotice>{notice}</PreviewNotice> : null}
    </div>
  );
}
