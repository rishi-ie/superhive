import type {
  ManageSectionDef,
} from "@/models/component";
import { OverviewSection } from "./OverviewSection";
import { IdentitySection } from "./IdentitySection";
import { SkillsSection, getSkillsAtoms } from "./SkillsSection";
import { ExtensionsSection, getExtensionsAtoms } from "./ExtensionsSection";
import { InboxSection } from "./InboxSection";
import { ThinkingLevelSection, getThinkingLevelAtoms } from "./ThinkingLevelSection";
import { AutonomySection } from "./AutonomySection";
import { ProjectContextSection } from "./ProjectContextSection";
import { ModelSection } from "./ModelSection";
import { AdvancedSection } from "./AdvancedSection";

export { OverviewSection };
export { IdentitySection };
export { SkillsSection };
export { ExtensionsSection };
export { InboxSection };
export { ThinkingLevelSection };
export type { SearchableAtom, SettingsSectionProps, ManageSectionDef } from "@/models/component";

export const MANAGE_SECTIONS: ManageSectionDef[] = [
	{
		id: "model",
		label: "Model",
		description: "The model used for the next turn",
		Component: ModelSection,
		getSearchableAtoms: () => [{ id: "model", label: "Model" }],
	},
	{
		id: "working-style",
		label: "Working style",
		description: "How much thought the agent applies by default",
		Component: ThinkingLevelSection,
		getSearchableAtoms: getThinkingLevelAtoms,
	},
	{
		id: "autonomy",
		label: "Autonomy",
		description: "How independently the agent can act",
		Component: AutonomySection,
		getSearchableAtoms: () => [{ id: "autonomy", label: "Autonomy" }],
	},
	{
		id: "project-context",
		label: "Project context",
		description: "The standing goal and constraints for this project",
		coordinatorOnly: true,
		Component: ProjectContextSection,
		getSearchableAtoms: () => [{ id: "project-context", label: "Project context" }],
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
    id: "advanced",
    label: "Advanced",
    description: "Fine-grained runtime settings",
    Component: AdvancedSection,
    getSearchableAtoms: () => [{ id: "advanced", label: "Advanced" }],
  },
];
