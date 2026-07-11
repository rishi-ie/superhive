import type { ComponentType } from "react";
import type { AgentSettingsState } from "@/flows/agents/settings";
import { OverviewSection } from "./OverviewSection";
import { HistorySection } from "./HistorySection";
import { PermissionsSection } from "./PermissionsSection";
import { CatalogManageSection } from "./CatalogManageSection";
import { InboxSection } from "./InboxSection";
import { SkillsSection } from "./SkillsSection";

export interface SettingsSectionProps {
  settings: AgentSettingsState;
  agentId: string;
  patch?: (key: string, value: unknown) => void;
  flush?: (p: Record<string, unknown>) => Promise<void>;
}

export { OverviewSection };
export { HistorySection };
export { PermissionsSection };
export { CatalogManageSection };
export { SkillsSection };
export { InboxSection };

export interface ManageSectionDef {
  id: string;
  label: string;
  Component: ComponentType<SettingsSectionProps>;
}

export const MANAGE_SECTIONS: ManageSectionDef[] = [
  { id: "history", label: "History", Component: HistorySection },
  { id: "permissions", label: "Permissions", Component: PermissionsSection },
  { id: "catalog", label: "Catalog", Component: CatalogManageSection },
];
