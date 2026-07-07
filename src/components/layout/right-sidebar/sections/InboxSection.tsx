import { HugeiconsIcon } from "@/components/ui/icon";
import { InboxIcon } from "@hugeicons/core-free-icons";
import type { SettingsSectionProps } from "./registry";

export function InboxSection({ settings }: SettingsSectionProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <HugeiconsIcon
        icon={InboxIcon}
        className="size-8 text-muted-foreground/30"
      />
      <p className="text-xs text-muted-foreground">
        No pending requests from{" "}
        <span className="text-foreground/80">
          {settings.name ?? "this agent"}
        </span>
        .
      </p>
    </div>
  );
}
