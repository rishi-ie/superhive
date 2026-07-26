import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { BookOpenTextIcon, TrayIcon, TreeViewIcon } from "@phosphor-icons/react";

export type RightSidebarTabId = "overview" | "manage" | "inbox";

export interface RightSidebarTabDefinition<TTabId extends string = string> {
  id: TTabId;
  label: string;
  description: string;
  icon: PhosphorIcon;
}

/**
 * Add future workspace pages here. The workspace derives its launcher,
 * tab strip, persistence validation, and ordering from this registry.
 */
export const RIGHT_SIDEBAR_TABS: readonly RightSidebarTabDefinition<RightSidebarTabId>[] = [
  {
    id: "overview",
    label: "Overview",
    description: "View current work and activity",
    icon: BookOpenTextIcon,
  },
  {
    id: "manage",
    label: "Manage",
    description: "Configure this workspace",
    icon: TreeViewIcon,
  },
  {
    id: "inbox",
    label: "Inbox",
    description: "Review requests and updates",
    icon: TrayIcon,
  },
];
