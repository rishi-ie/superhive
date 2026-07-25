import { CaretDownIcon } from "@phosphor-icons/react";
import { Icon } from "@/components/ui/icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SettingsSectionProps, SearchableAtom } from "./registry";

const THINKING_LEVELS = [
  { value: "low", label: "Concise" },
  { value: "medium", label: "Balanced" },
  { value: "high", label: "Thorough" },
] as const;

type ThinkingLevel = (typeof THINKING_LEVELS)[number]["value"];

export function ThinkingLevelSection({ settings, patch }: SettingsSectionProps) {
  const current = (settings.defaultThinkingLevel ?? "medium") as ThinkingLevel;
  const currentLabel =
    THINKING_LEVELS.find((l) => l.value === current)?.label ?? "Balanced";

  const onChange = (next: string) => {
    if (THINKING_LEVELS.some((l) => l.value === next)) {
      patch?.("defaultThinkingLevel", next);
    }
  };

  return (
    <div className="flex flex-col gap-gap-loose px-1 py-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center justify-between gap-list-item text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground cursor-default w-full"
          >
            <span>{currentLabel}</span>
            <Icon icon={CaretDownIcon} className="size-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[160px] bg-modal text-modal-foreground">
          <DropdownMenuRadioGroup value={current} onValueChange={onChange}>
            {THINKING_LEVELS.map((l) => (
              <DropdownMenuRadioItem key={l.value} value={l.value}>
                <span>{l.label}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function getThinkingLevelAtoms(): SearchableAtom[] {
  return [
    { id: "settings.defaultThinkingLevel", label: "Thinking level", description: "Default thinking effort for this agent" },
    { id: "thinking-level", label: "Thinking Level" },
  ];
}
