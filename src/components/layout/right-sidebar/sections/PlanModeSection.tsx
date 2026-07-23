/**
 * PlanModeSection — manage-tab controls for the plan-mode extension.
 *
 * Bound to `settings.planMode` in the truth file. The plan extension
 * reads this block on session_start and before_agent_start, so any
 * change here takes effect on the next user turn (live flip).
 *
 * Coordinator-only. The AgentSettingsPanel gates the section on
 * agentKind === 'project-coordinator' before rendering.
 */

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { CaretDownIcon } from "@phosphor-icons/react";
import { Icon } from "@/components/ui/icon";
import { SettingRow } from "../primitives/SettingRow";
import type { SearchableAtom, SettingsSectionProps } from "./registry";

type PlanDefaultMode = "plan" | "build" | "auto";
type PlanThinkingLevel =
  | "inherit"
  | "off"
  | "minimal"
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | "max";

interface PlanModeBlock {
  defaultMode?: PlanDefaultMode;
  thinkingLevel?: PlanThinkingLevel;
  defaultPlanTools?: string[];
  safeSubcommands?: {
    git?: string[];
    gh?: string[];
  };
}

const DEFAULT_PLAN_MODE_BLOCK: PlanModeBlock = {
  defaultMode: "auto",
  thinkingLevel: "inherit",
};

const DEFAULT_MODE_OPTIONS: Array<{ value: PlanDefaultMode; label: string }> = [
  { value: "plan", label: "Plan" },
  { value: "build", label: "Build" },
  { value: "auto", label: "Auto" },
];

const THINKING_LEVEL_OPTIONS: Array<{ value: PlanThinkingLevel; label: string }> = [
  { value: "inherit", label: "Inherit" },
  { value: "off", label: "Off" },
  { value: "minimal", label: "Minimal" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "xhigh", label: "XHigh" },
  { value: "max", label: "Max" },
];

// Built-in safe plan tools from the upstream extension's SAFE_BUILTIN_PLAN_TOOLS.
// Matches tool-policy.ts:23 in superhive-pi-plan.
const BUILTIN_PLAN_TOOLS = ["read", "bash", "grep", "find", "ls"] as const;

// Safe git subcommands (full set from tool-policy.ts SAFE_GIT_SUBCOMMANDS).
const SAFE_GIT_SUBCOMMANDS = [
  "status",
  "log",
  "diff",
  "show",
  "branch",
  "remote",
  "ls-files",
  "grep",
  "rev-parse",
  "blame",
  "describe",
  "merge-base",
  "ls-tree",
  "cat-file",
] as const;

// Safe gh read paths (from tool-policy.ts SAFE_GH_SUBCOMMAND_PATHS).
const SAFE_GH_SUBCOMMAND_PATHS = [
  "pr view",
  "pr list",
  "issue view",
  "issue list",
] as const;

function readBlock(settings: SettingsSectionProps["settings"]): PlanModeBlock {
  return (settings.planMode as PlanModeBlock | undefined) ?? {};
}

function writeBlock(patch: SettingsSectionProps["patch"], next: PlanModeBlock) {
  patch?.("planMode", next);
}

export function getPlanModeAtoms(
  _settings: SettingsSectionProps["settings"],
): SearchableAtom[] {
  return [
    { id: "planMode.defaultMode", label: "Default mode", description: "Plan, build, or auto" },
    {
      id: "planMode.thinkingLevel",
      label: "Thinking level",
      description: "Plan-mode thinking level override",
    },
    {
      id: "planMode.defaultPlanTools",
      label: "Default plan tools",
      description: "Tools available while plan mode is on",
    },
    {
      id: "planMode.safeSubcommands",
      label: "Safe subcommands",
      description: "Git and gh allowlist for plan-mode bash",
    },
    { id: "plan-mode", label: "Plan Mode" },
  ];
}

export function PlanModeSection({ settings, patch }: SettingsSectionProps) {
  // Coordinator gate. The truth file's `project` block is only present
  // for project-coordinator agents. The plan extension also gates on this
  // block in its session_start handler, so we use the same signal here.
  const project = (settings as SettingsSectionProps["settings"] & {
    project?: { localPath?: string; coordinatorAgentId?: string };
  }).project;
  if (!project?.localPath || !project.coordinatorAgentId) return null;

  const block = readBlock(settings);
  const merged = { ...DEFAULT_PLAN_MODE_BLOCK, ...block };
  const defaultMode: PlanDefaultMode = merged.defaultMode ?? "auto";
  const thinkingLevel: PlanThinkingLevel = merged.thinkingLevel ?? "inherit";
  const defaultPlanTools = new Set(merged.defaultPlanTools ?? []);
  const safeGit = new Set(merged.safeSubcommands?.git ?? []);
  const safeGh = new Set(merged.safeSubcommands?.gh ?? []);

  const setDefaultMode = (next: PlanDefaultMode) => {
    writeBlock(patch, { ...block, defaultMode: next });
  };

  const setThinkingLevel = (next: PlanThinkingLevel) => {
    writeBlock(patch, { ...block, thinkingLevel: next });
  };

  const togglePlanTool = (tool: string) => {
    const next = new Set(defaultPlanTools);
    if (next.has(tool)) next.delete(tool);
    else next.add(tool);
    writeBlock(patch, {
      ...block,
      defaultPlanTools: Array.from(next),
    });
  };

  const toggleSafeSubcommand = (
    bucket: "git" | "gh",
    value: string,
  ) => {
    const current = new Set(
      bucket === "git" ? merged.safeSubcommands?.git ?? [] : merged.safeSubcommands?.gh ?? [],
    );
    if (current.has(value)) current.delete(value);
    else current.add(value);
    writeBlock(patch, {
      ...block,
      safeSubcommands: {
        ...(merged.safeSubcommands ?? {}),
        [bucket]: Array.from(current),
      },
    });
  };

  return (
    <div className="flex flex-col gap-gap-loose py-1">
      <SettingRow
        label="Default mode"
        description="Plan = always plan; Build = never plan; Auto = user toggles"
      >
        <SelectDropdown
          value={defaultMode}
          options={DEFAULT_MODE_OPTIONS}
          onChange={(v) => setDefaultMode(v as PlanDefaultMode)}
        />
      </SettingRow>

      <SettingRow
        label="Thinking level"
        description="Applied only while plan mode is active"
      >
        <SelectDropdown
          value={thinkingLevel}
          options={THINKING_LEVEL_OPTIONS}
          onChange={(v) => setThinkingLevel(v as PlanThinkingLevel)}
        />
      </SettingRow>

      <div className="flex flex-col gap-gap-tight">
        <span className="text-xs text-muted-foreground">Default plan tools</span>
        <div className="flex flex-wrap gap-1.5">
          {BUILTIN_PLAN_TOOLS.map((tool) => (
            <label
              key={tool}
              className="flex items-center gap-1.5 text-xs text-sidebar-foreground/80 cursor-pointer"
            >
              <Switch
                checked={defaultPlanTools.has(tool)}
                onCheckedChange={() => togglePlanTool(tool)}
              />
              <span>{tool}</span>
            </label>
          ))}
        </div>
      </div>

      <SafeSubcommandRow
        label="Safe git subcommands"
        options={SAFE_GIT_SUBCOMMANDS as unknown as readonly string[]}
        active={safeGit}
        onToggle={(v) => toggleSafeSubcommand("git", v)}
      />

      <SafeSubcommandRow
        label="Safe gh subcommands"
        options={SAFE_GH_SUBCOMMAND_PATHS as unknown as readonly string[]}
        active={safeGh}
        onToggle={(v) => toggleSafeSubcommand("gh", v)}
      />
    </div>
  );
}

interface SelectDropdownProps<T extends string> {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}

function SelectDropdown<T extends string>({
  value,
  options,
  onChange,
}: SelectDropdownProps<T>) {
  const current = options.find((o) => o.value === value) ?? options[0]!;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-sidebar-foreground/80 hover:text-sidebar-foreground cursor-default"
        >
          <span>{current.label}</span>
          <Icon icon={CaretDownIcon} className="size-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px] bg-modal text-modal-foreground">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as T)}>
          {options.map((o) => (
            <DropdownMenuRadioItem key={o.value} value={o.value}>
              <span>{o.label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface SafeSubcommandRowProps {
  label: string;
  options: readonly string[];
  active: Set<string>;
  onToggle: (value: string) => void;
}

function SafeSubcommandRow({ label, options, active, onToggle }: SafeSubcommandRowProps) {
  return (
    <div className="flex flex-col gap-gap-tight">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <label
            key={opt}
            className="flex items-center gap-1.5 text-[11px] text-sidebar-foreground/80 cursor-pointer"
          >
            <Switch
              checked={active.has(opt)}
              onCheckedChange={() => onToggle(opt)}
            />
            <code className="font-mono">{opt}</code>
          </label>
        ))}
      </div>
    </div>
  );
}
