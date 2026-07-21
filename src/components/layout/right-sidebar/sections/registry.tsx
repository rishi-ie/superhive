import type { AgentSettingsState } from "@/models/agent";
import type {
  ManageSectionDef,
  SearchableAtom,
} from "@/models/component";
import { OverviewSection } from "./OverviewSection";
import { IdentitySection } from "./IdentitySection";
import { BehaviorSection } from "./BehaviorSection";
import { PermissionsSection, getPermissionsAtoms } from "./PermissionsSection";
import { SkillsSection, getSkillsAtoms } from "./SkillsSection";
import { ExtensionsSection, getExtensionsAtoms } from "./ExtensionsSection";
import { PromptsSection, getPromptsAtoms } from "./PromptsSection";
import { InboxSection } from "./InboxSection";

export { OverviewSection };
export { IdentitySection };
export { BehaviorSection };
export { PermissionsSection };
export { SkillsSection };
export { ExtensionsSection };
export { PromptsSection };
export { InboxSection };
export type { SearchableAtom, SettingsSectionProps, ManageSectionDef } from "@/models/component";

function getIdentityAtoms(settings: AgentSettingsState): SearchableAtom[] {
  return [
    { id: "name", label: settings.name || "Name", description: "Agent display name" },
    { id: "description", label: "Description", description: "Brief description" },
    { id: "identity", label: "Identity" },
  ];
}

function getBehaviorAtoms(): SearchableAtom[] {
  return [
    { id: "system", label: "System prompt", description: "Agent instructions" },
    { id: "behavior", label: "Behavior" },
    { id: "permissions", label: "Permissions", description: "Filesystem, terminal, network" },
  ];
}

export const MANAGE_SECTIONS: ManageSectionDef[] = [
  {
    id: "identity",
    label: "Identity",
    description: "Name and description",
    Component: IdentitySection,
    getSearchableAtoms: getIdentityAtoms,
  },
  {
    id: "behavior",
    label: "Behavior",
    description: "System prompt and permissions",
    Component: BehaviorSection,
    getSearchableAtoms: getBehaviorAtoms,
  },
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
