import { Segmented } from "../primitives/Segmented";
import { SwitchRow } from "../primitives/SwitchRow";
import type { SettingsSectionProps } from "./registry";

/**
 * Behavior section — `settings.behavior.*` (manage.json).
 *
 * The 4-file split moved `systemPrompt` to settings.json (out of manage's
 * scope) and surfaced the full behavior block (steering, follow-up,
 * compaction, retry) on manage.json for the user-tweakable surface.
 *
 * Plan-mode and permissions live in their own dedicated sections
 * (`PlanModeSection`, `PermissionsSection`). Behavior stays focused on
 * the queue-time + retry + compaction toggles.
 */

const STEERING_OPTIONS: Array<{ value: "all" | "one-at-a-time"; label: string }> = [
  { value: "all", label: "All" },
  { value: "one-at-a-time", label: "One at a time" },
];

const FOLLOW_UP_OPTIONS: Array<{ value: "all" | "one-at-a-time" | "none"; label: string }> = [
  { value: "all", label: "All" },
  { value: "one-at-a-time", label: "One at a time" },
  { value: "none", label: "None" },
];

export function BehaviorSection({ settings, patch }: SettingsSectionProps) {
  const behavior = (settings.behavior ?? {}) as {
    steeringMode?: "all" | "one-at-a-time";
    followUpMode?: "all" | "one-at-a-time" | "none";
    autoCompaction?: boolean;
    autoRetry?: boolean;
  };

  const setSteering = (next: "all" | "one-at-a-time") =>
    patch?.("behavior.steeringMode", next);
  const setFollowUp = (next: "all" | "one-at-a-time" | "none") =>
    patch?.("behavior.followUpMode", next);
  const setAutoCompaction = (v: boolean) =>
    patch?.("behavior.autoCompaction", v);
  const setAutoRetry = (v: boolean) => patch?.("behavior.autoRetry", v);

  return (
    <div className="flex flex-col gap-gap-loose py-1">
      <div className="flex flex-col gap-gap-tight">
        <span className="text-xs text-muted-foreground">Steering mode</span>
        <Segmented
          options={STEERING_OPTIONS}
          value={behavior.steeringMode ?? "all"}
          onValueChange={setSteering}
        />
      </div>

      <div className="flex flex-col gap-gap-tight">
        <span className="text-xs text-muted-foreground">Follow-up mode</span>
        <Segmented
          options={FOLLOW_UP_OPTIONS}
          value={behavior.followUpMode ?? "all"}
          onValueChange={setFollowUp}
        />
      </div>

      <SwitchRow
        label="Auto compaction"
        description="Auto-compact when context gets full"
        checked={behavior.autoCompaction ?? true}
        onCheckedChange={setAutoCompaction}
      />

      <SwitchRow
        label="Auto retry"
        description="Retry failed turns automatically"
        checked={behavior.autoRetry ?? true}
        onCheckedChange={setAutoRetry}
      />
    </div>
  );
}
