import * as React from "react";
import { Segmented } from "@/components/layout/right-sidebar/primitives/Segmented";
import { SettingsPanel, SettingsRow } from "../SettingsPrimitives";
import { PreviewNotice } from "./MockPrimitives";

type Theme = "system" | "light" | "dark";
type Density = "comfortable" | "compact";
type TextSize = "small" | "default" | "large";

export function AppearanceSection() {
  const [theme, setTheme] = React.useState<Theme>("system");
  const [density, setDensity] = React.useState<Density>("comfortable");
  const [textSize, setTextSize] = React.useState<TextSize>("default");

  return (
    <div className="flex flex-col gap-12">
      <PreviewNotice />

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-medium tracking-tight text-foreground">Theme</h2>
        <SettingsPanel>
          <SettingsRow title="Color theme" description="Choose how Superhive looks on this Mac.">
            <Segmented
              className="w-56"
              value={theme}
              onValueChange={setTheme}
              options={[{ value: "system", label: "System" }, { value: "light", label: "Light" }, { value: "dark", label: "Dark" }]}
            />
          </SettingsRow>
          <div className="flex gap-3 px-(--card-spacing) pb-(--card-spacing)">
            {["System", "Light", "Dark"].map((label) => (
              <div key={label} className="flex flex-1 flex-col gap-2 rounded-card border border-border p-3">
                <div className="h-12 rounded-sm border border-border bg-muted" />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </SettingsPanel>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-medium tracking-tight text-foreground">Layout</h2>
        <SettingsPanel>
          <SettingsRow title="Interface density" description="Adjust spacing throughout the workspace.">
            <Segmented
              className="w-44"
              value={density}
              onValueChange={setDensity}
              options={[{ value: "comfortable", label: "Comfortable" }, { value: "compact", label: "Compact" }]}
            />
          </SettingsRow>
          <SettingsRow title="Chat text size" description="Adjust text size in conversations.">
            <Segmented
              className="w-48"
              value={textSize}
              onValueChange={setTextSize}
              options={[{ value: "small", label: "Small" }, { value: "default", label: "Default" }, { value: "large", label: "Large" }]}
            />
          </SettingsRow>
        </SettingsPanel>
      </section>
    </div>
  );
}
