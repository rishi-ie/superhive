import type {
  ManageSectionDef,
} from "@/models/component";
import { OverviewSection } from "./OverviewSection";
import { IdentitySection } from "./IdentitySection";
import { BehaviorSection } from "./BehaviorSection";
import { PermissionsSection, getPermissionsAtoms } from "./PermissionsSection";
import { SkillsSection, getSkillsAtoms } from "./SkillsSection";
import { ExtensionsSection, getExtensionsAtoms } from "./ExtensionsSection";
import { InboxSection } from "./InboxSection";
import { PlanModeSection, getPlanModeAtoms } from "./PlanModeSection";
import { ThinkingLevelSection, getThinkingLevelAtoms } from "./ThinkingLevelSection";

export { OverviewSection };
export { IdentitySection };
export { BehaviorSection };
export { PermissionsSection };
export { SkillsSection };
export { ExtensionsSection };
export { InboxSection };
export { PlanModeSection };
export { ThinkingLevelSection };
export type { SearchableAtom, SettingsSectionProps, ManageSectionDef } from "@/models/component";

export const MANAGE_SECTIONS: ManageSectionDef[] = [
	{
		id: "operating-mode",
		label: "Operating Mode",
		description: "Plan safely or execute work",
		coordinatorOnly: true,
		Component: PlanModeSection,
		getSearchableAtoms: getPlanModeAtoms,
	},
	{
		id: "permissions",
		label: "Permissions",
		description: "Runtime access allowed for the agent",
		Component: PermissionsSection,
		getSearchableAtoms: getPermissionsAtoms,
	},
	{
		id: "behavior",
		label: "Behavior",
		description: "Queue, follow-up, retry, and compaction defaults",
		Component: BehaviorSection,
		getSearchableAtoms: () => [
			{ id: "behavior", label: "Behavior", description: "Queue, retry, and compaction settings" },
		],
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
    id: "thinking-level",
    label: "Thinking Level",
    description: "Default thinking effort for this agent",
    Component: ThinkingLevelSection,
    getSearchableAtoms: getThinkingLevelAtoms,
  },
];
