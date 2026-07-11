import { Icon } from "@/components/ui/icon";
import { TrayIcon } from "@phosphor-icons/react";
import type { SettingsSectionProps } from "./registry";

export function InboxSection({ settings }: SettingsSectionProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-gap-loose p-card text-center">
      <Icon
        icon={TrayIcon}
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
