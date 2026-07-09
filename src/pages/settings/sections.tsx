import { HugeiconsIcon } from "@/components/ui/icon";
import {
  Settings01Icon,
  UserIcon,
  PaintBrush01Icon,
  AiBrain01Icon,
  Robot02Icon,
  ChartLineData01Icon,
  GlobalIcon,
  ToolsIcon,
  Book01Icon,
  TestTubeIcon,
  Book02Icon,
  ArrowUpRight01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import type { ReactNode } from "react";

type IconComponent = (props: { className?: string }) => ReactNode;

function makeIcon(icon: IconSvgElement): IconComponent {
  return function Icon({ className }: { className?: string }) {
    return <HugeiconsIcon icon={icon} className={className} />;
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
      { id: "general", label: "General", icon: makeIcon(Settings01Icon) },
      { id: "account", label: "Account", icon: makeIcon(UserIcon) },
      { id: "appearance", label: "Appearance", icon: makeIcon(PaintBrush01Icon) },
    ],
  },
  {
    sections: [
      { id: "models", label: "Models", icon: makeIcon(AiBrain01Icon) },
      { id: "agents", label: "Agents", icon: makeIcon(Robot02Icon) },
      { id: "plans", label: "Plans and Usage", icon: makeIcon(ChartLineData01Icon) },
      { id: "remote", label: "Remote", icon: makeIcon(GlobalIcon) },
      { id: "tools", label: "Tools", icon: makeIcon(ToolsIcon) },
      { id: "rules", label: "Rules & Skills", icon: makeIcon(Book01Icon) },
    ],
  },
  {
    sections: [
      { id: "beta", label: "Beta", icon: makeIcon(TestTubeIcon) },
      { id: "docs", label: "Docs", icon: makeIcon(Book02Icon), trailingIcon: makeIcon(ArrowUpRight01Icon) },
    ],
  },
];

export const SETTINGS_SECTIONS: SettingsSection[] =
  SETTINGS_GROUPS.flatMap((g) => g.sections);
