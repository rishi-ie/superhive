import { HugeiconsIcon } from "@/components/ui/icon";
import { UserIcon, PaintBrush01Icon, Key01Icon } from "@hugeicons/core-free-icons";
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
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: "general", label: "General", icon: makeIcon(PaintBrush01Icon) },
  { id: "account", label: "Account", icon: makeIcon(UserIcon) },
  { id: "api", label: "API Keys", icon: makeIcon(Key01Icon) },
];
