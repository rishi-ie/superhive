import type { ComponentType } from "react";
import type { AgentSettingsState } from "@/flows/agents/settings";
import { OverviewSection } from "./OverviewSection";
import { PermissionsSection, getPermissionsAtoms } from "./PermissionsSection";
import { SkillsSection, getSkillsAtoms } from "./SkillsSection";
import { ExtensionsSection, getExtensionsAtoms } from "./ExtensionsSection";
import { PromptsSection, getPromptsAtoms } from "./PromptsSection";
import { InboxSection } from "./InboxSection";

export interface SearchableAtom {
  id: string;
  label: string;
  description?: string;
}

export interface SettingsSectionProps {
  settings: AgentSettingsState;
  agentId: string;
  query?: string;
  patch?: (key: string, value: unknown) => void;
  flush?: (p: Record<string, unknown>) => Promise<void>;
}

export { OverviewSection };
export { PermissionsSection };
export { SkillsSection };
export { ExtensionsSection };
export { PromptsSection };
export { InboxSection };

export interface ManageSectionDef {
  id: string;
  label: string;
  description?: string;
  Component: ComponentType<SettingsSectionProps>;
  getSearchableAtoms: (settings: AgentSettingsState) => SearchableAtom[];
}

export const MANAGE_SECTIONS: ManageSectionDef[] = [
  {
    id: "permissions",
    label: "Permissions",
    description: "Filesystem, terminal, and network access",
    Component: PermissionsSection,
    getSearchableAtoms: getPermissionsAtoms,
  },
  {
    id: "skills",
    label: "Skills",
    description: "Agent capabilities and tool sets",
    Component: SkillsSection,
    getSearchableAtoms: getSkillsAtoms,
  },
  {
    id: "extensions",
    label: "Extensions",
    description: "Code and integrations",
    Component: ExtensionsSection,
    getSearchableAtoms: getExtensionsAtoms,
  },
  {
    id: "prompts",
    label: "Prompts",
    description: "Prompt templates and instructions",
    Component: PromptsSection,
    getSearchableAtoms: getPromptsAtoms,
  },
];
