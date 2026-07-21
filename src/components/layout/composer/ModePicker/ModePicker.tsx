import * as React from "react";
import { CaretDownIcon } from "@phosphor-icons/react";
import type { HugeiconsIconProps } from "@hugeicons/react";
import {
  Plant01Icon,
  RepairIcon,
  LanternIcon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/icon";
import { HugeIcon } from "@/components/ui/huge-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Mode } from "@/models/component";

const MODES: Array<{ value: Mode; label: string; icon: HugeiconsIconProps["icon"] }> = [
  { value: "plan", label: "Plan", icon: Plant01Icon },
  { value: "execute", label: "Build", icon: RepairIcon },
  { value: "auto", label: "Auto mode", icon: LanternIcon },
];

export function ModePicker() {
  const [mode, setMode] = React.useState<Mode>("execute");
  const current = MODES.find((m) => m.value === mode) ?? MODES[1]!;
  const CurrentIcon = current.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-list-item text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground cursor-default"
        >
          <HugeIcon icon={CurrentIcon} size={16} />
          <span>{current.label}</span>
          <Icon icon={CaretDownIcon} className="size-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[140px] bg-modal text-modal-foreground">
        <DropdownMenuRadioGroup
          value={mode}
          onValueChange={(v) => setMode(v as Mode)}
        >
          {MODES.map((m) => (
            <DropdownMenuRadioItem key={m.value} value={m.value}>
              <HugeIcon icon={m.icon} size={14} className="text-modal-foreground/70" />
              <span>{m.label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}