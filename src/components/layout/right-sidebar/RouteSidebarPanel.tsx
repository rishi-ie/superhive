import { Icon } from "@/components/ui/icon";
import { FolderSimpleIcon } from "@phosphor-icons/react";
import type { RightSidebarTabId } from "./right-sidebar-tabs";

interface RouteSidebarPanelProps {
  contextLabel: string;
  activeTab: RightSidebarTabId;
}

export function RouteSidebarPanel({ contextLabel, activeTab }: RouteSidebarPanelProps) {
  const copy = {
    overview: "Overview content will appear here.",
    manage: "Workspace settings will appear here.",
    inbox: "No new requests or updates.",
  }[activeTab];

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <Icon icon={FolderSimpleIcon} className="size-5 text-muted-foreground/50" />
      <div>
        <p className="text-sm font-medium text-foreground">{contextLabel}</p>
        <p className="mt-1 text-xs text-muted-foreground">{copy}</p>
      </div>
    </div>
  );
}
