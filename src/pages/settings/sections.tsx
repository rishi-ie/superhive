import { Icon } from "@/components/ui/icon";
import {
  GearIcon,
  UserIcon,
  PaintBrushIcon,
  BrainIcon,
  RobotIcon,
  ChartLineUpIcon,
  GlobeIcon,
  ToolboxIcon,
  BookIcon,
  TestTubeIcon,
  ArrowUpRightIcon,
} from "@phosphor-icons/react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";

type IconComponent = (props: { className?: string }) => ReactNode;

function makeIcon(icon: PhosphorIcon): IconComponent {
  return function Icon({ className }: { className?: string }) {
    return <Icon icon={icon} className={className} />;
  };
}

export interface SettingsSection {
  id: string;
  label: string;
  icon: IconComponent;
  trailingIcon?: IconComponent;
}

export interface SettingsSectionGroup {
  title?: string;
  sections: SettingsSection[];
}

export const SETTINGS_GROUPS: SettingsSectionGroup[] = [
  {
    sections: [
      { id: "general", label: "General", icon: makeIcon(GearIcon) },
      { id: "account", label: "Account", icon: makeIcon(UserIcon) },
      { id: "appearance", label: "Appearance", icon: makeIcon(PaintBrushIcon) },
    ],
  },
  {
    sections: [
      { id: "models", label: "Models", icon: makeIcon(BrainIcon) },
      { id: "agents", label: "Agents", icon: makeIcon(RobotIcon) },
      { id: "plans", label: "Plans and Usage", icon: makeIcon(ChartLineUpIcon) },
      { id: "remote", label: "Remote", icon: makeIcon(GlobeIcon) },
      { id: "tools", label: "Tools", icon: makeIcon(ToolboxIcon) },
      { id: "rules", label: "Rules & Skills", icon: makeIcon(BookIcon) },
    ],
  },
  {
    sections: [
      { id: "beta", label: "Beta", icon: makeIcon(TestTubeIcon) },
      { id: "docs", label: "Docs", icon: makeIcon(BookIcon), trailingIcon: makeIcon(ArrowUpRightIcon) },
    ],
  },
];

export const SETTINGS_SECTIONS: SettingsSection[] =
  SETTINGS_GROUPS.flatMap((g) => g.sections);
