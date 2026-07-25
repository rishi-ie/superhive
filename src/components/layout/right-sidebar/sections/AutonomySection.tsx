import { Segmented } from "../primitives/Segmented";
import type { SettingsSectionProps } from "./registry";

type Autonomy = "guided" | "workspace" | "full";

const PRESETS: Record<Autonomy, { label: string; permissions: { filesystem: boolean; terminal: boolean; network: boolean } }> = {
  guided: { label: "Guided", permissions: { filesystem: true, terminal: false, network: false } },
  workspace: { label: "Workspace", permissions: { filesystem: true, terminal: true, network: false } },
  full: { label: "Full", permissions: { filesystem: true, terminal: true, network: true } },
};

function currentPreset(permissions: { filesystem?: boolean; terminal?: boolean; network?: boolean }): Autonomy {
  return (Object.keys(PRESETS) as Autonomy[]).find((key) =>
    Object.entries(PRESETS[key].permissions).every(([name, enabled]) => permissions[name as keyof typeof permissions] === enabled),
  ) ?? "full";
}

export function AutonomySection({ settings, patch }: SettingsSectionProps) {
  const permissions = (settings.permissions ?? { filesystem: true, terminal: true, network: true }) as {
    filesystem?: boolean; terminal?: boolean; network?: boolean;
  };
  const value = currentPreset(permissions);

  return (
    <div className="flex flex-col gap-1 py-1">
      <Segmented
        options={(Object.keys(PRESETS) as Autonomy[]).map((key) => ({ value: key, label: PRESETS[key].label }))}
        value={value}
        onValueChange={(next) => patch?.("permissions", PRESETS[next as Autonomy].permissions)}
      />
      <span className="text-[11px] text-muted-foreground">
        {value === "guided" ? "The agent analyzes and asks before taking actions." : value === "workspace" ? "The agent can work locally, but cannot use the network." : "The agent can use all enabled workspace capabilities."}
      </span>
    </div>
  );
}
