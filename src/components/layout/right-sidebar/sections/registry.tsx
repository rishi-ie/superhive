import type { ComponentType } from "react";
import type { AgentSettingsState } from "@/flows/agents/settings";
import { OverviewSection } from "./OverviewSection";
import { IdentityManageSection } from "./IdentityManageSection";
import { BehaviorManageSection } from "./BehaviorManageSection";
import { InboxSection } from "./InboxSection";
import { SkillsSection } from "./SkillsSection";

export interface SettingsSectionProps {
  settings: AgentSettingsState;
  agentId: string;
  patch: (key: string, value: unknown) => void;
  flush: (p: Record<string, unknown>) => Promise<void>;
}

export { OverviewSection };
export { IdentityManageSection };
export { BehaviorManageSection };
export { SkillsSection };
export { InboxSection };

export interface ManageSectionDef {
  id: string;
  label: string;
  Component: ComponentType<SettingsSectionProps>;
}

export const MANAGE_SECTIONS: ManageSectionDef[] = [
  { id: "identity", label: "Identity", Component: IdentityManageSection },
  { id: "behavior", label: "Behavior", Component: BehaviorManageSection },
];