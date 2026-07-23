import type {
  ManageSectionDef,
  SearchableAtom,
  SettingsSectionProps,
} from "@/models/component";
import { OverviewSection } from "./OverviewSection";
import { IdentitySection } from "./IdentitySection";
import { BehaviorSection } from "./BehaviorSection";
import { PermissionsSection, getPermissionsAtoms } from "./PermissionsSection";
import { SkillsSection, getSkillsAtoms } from "./SkillsSection";
import { ExtensionsSection, getExtensionsAtoms } from "./ExtensionsSection";
import { PromptsSection, getPromptsAtoms } from "./PromptsSection";
import { InboxSection } from "./InboxSection";
import { PlanModeSection, getPlanModeAtoms } from "./PlanModeSection";

export { OverviewSection };
export { IdentitySection };
export { BehaviorSection };
export { PermissionsSection };
export { SkillsSection };
export { ExtensionsSection };
export { PromptsSection };
export { InboxSection };
export { PlanModeSection };
export type { SearchableAtom, SettingsSectionProps, ManageSectionDef } from "@/models/component";

function getIdentityAtoms(settings: SettingsSectionProps["settings"]): SearchableAtom[] {
  const identity = (settings.identity ?? {}) as { name?: string; description?: string; workspace?: string };
  return [
    { id: "identity.name", label: "Name", description: identity.name || "Agent display name" },
    { id: "identity.description", label: "Description", description: "Brief description" },
    { id: "identity.workspace", label: "Workspace", description: "Working directory" },
    { id: "identity", label: "Identity" },
  ];
}

function getBehaviorAtoms(): SearchableAtom[] {
  return [
    { id: "behavior.steeringMode", label: "Steering mode", description: "How steering messages queue up" },
    { id: "behavior.followUpMode", label: "Follow-up mode", description: "How follow-up messages queue up" },
    { id: "behavior.autoCompaction", label: "Auto compaction", description: "Auto-compact context when full" },
    { id: "behavior.autoRetry", label: "Auto retry", description: "Retry failed turns automatically" },
    { id: "behavior", label: "Behavior" },
  ];
}

export const MANAGE_SECTIONS: ManageSectionDef[] = [
  {
    id: "identity",
    label: "Identity",
    description: "Name, description, and workspace",
    Component: IdentitySection,
    getSearchableAtoms: getIdentityAtoms,
  },
  {
    id: "behavior",
    label: "Behavior",
    description: "Steering, follow-up, compaction, retry",
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
  {
    id: "plan-mode",
    label: "Plan Mode",
    description: "Default mode, thinking level, and safe tools for plan-mode planning",
    coordinatorOnly: true,
    Component: PlanModeSection,
    getSearchableAtoms: getPlanModeAtoms,
  },
];

