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
import { useAgentManage } from "@/flows/agents/settings";
import type { Mode } from "@/models/component";

const MODES: Array<{ value: Mode; label: string; icon: HugeiconsIconProps["icon"] }> = [
  { value: "plan", label: "Plan", icon: Plant01Icon },
  { value: "execute", label: "Build", icon: RepairIcon },
  { value: "auto", label: "Auto mode", icon: LanternIcon },
];

/**
 * The composer's `Mode` type uses `execute` for what truth's plan extension
 * calls `build`. This is the only place the two are reconciled.
 */
const MODE_TO_TRUTH: Record<Mode, "plan" | "build" | "auto"> = {
  plan: "plan",
  execute: "build",
  auto: "auto",
};

const TRUTH_TO_MODE: Record<"plan" | "build" | "auto", Mode> = {
  plan: "plan",
  build: "execute",
  auto: "auto",
};

interface ModePickerProps {
  agentId: string;
}

export function ModePicker({ agentId }: ModePickerProps) {
  const { settings, patch } = useAgentManage(agentId);
  const planModeBlock = settings?.planMode as
    | { defaultMode?: "plan" | "build" | "auto" }
    | undefined;
  const truthDefaultMode = (planModeBlock?.defaultMode ?? "auto") as
    | "plan"
    | "build"
    | "auto";
  const mode: Mode = TRUTH_TO_MODE[truthDefaultMode];
  const current = MODES.find((m) => m.value === mode) ?? MODES[2]!;
  const CurrentIcon = current.icon;

  const onChange = (next: string) => {
    if (next !== "plan" && next !== "execute" && next !== "auto") return;
    const truthValue = MODE_TO_TRUTH[next];
    patch("planMode", { ...(planModeBlock ?? {}), defaultMode: truthValue });
  };

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
        <DropdownMenuRadioGroup value={mode} onValueChange={onChange}>
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
