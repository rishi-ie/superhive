/**
 * Agent control matrix — model dropdown, permissions, commit authority, thinking budget.
 * Production-grade. Auto-saves each change with toast feedback.
 */
import { useState } from 'react';
import {
  ChevronDown, AlertTriangle, Sparkles, Cpu, Globe, Bot, Pencil,
} from 'lucide-react';
import {
  STROKE_WIDTH, COST_PER_TASK, MIN_TOKENS, MAX_TOKENS, TOKEN_STEP,
} from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/Slider';
import { Switch } from '@/components/ui/Switch';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/lib/toast-context';
import {
  getPermissions,
  setPermissions,
  type Agent,
  type Permissions,
} from '@/data/agents/store';
import type { CommitAuthority } from '@/data/agents/interface';
import { AgentEditDialog } from '@/components/center-workspace/AgentEditDialog';

/* ─── Model catalog ───────────────────────────────────── */

type CatalogEntry = {
  id: string;
  label: string;
  provider: string;
  role: string;
  cost: string;
  ctx: string;
  icon: typeof Sparkles;
  iconClass: string;
};

type CatalogGroup = { label: string; entries: CatalogEntry[] };

const PROVIDER_LABELS: Record<string, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google',
  custom: 'Custom',
};

const MODEL_CATALOG: CatalogEntry[] = [
  {
    id: 'opus-4.1',
    label: 'Claude Opus 4.1',
    provider: 'anthropic',
    role: 'Reasoning',
    cost: '$18/hr',
    ctx: '200K',
    icon: Sparkles,
    iconClass: 'text-[#D4A373]',
  },
  {
    id: 'sonnet-4.5',
    label: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    role: 'Balanced',
    cost: '$3/hr',
    ctx: '200K',
    icon: Sparkles,
    iconClass: 'text-[#D4A373]',
  },
  {
    id: 'haiku-4.5',
    label: 'Claude Haiku 4.5',
    provider: 'anthropic',
    role: 'Concise',
    cost: '$0.80/hr',
    ctx: '200K',
    icon: Sparkles,
    iconClass: 'text-[#D4A373]',
  },
  {
    id: 'gpt-4o',
    label: 'GPT-4o',
    provider: 'openai',
    role: 'Balanced',
    cost: '$5/hr',
    ctx: '128K',
    icon: Bot,
    iconClass: 'text-[#10A37F]',
  },
  {
    id: 'gemini-2.5',
    label: 'Gemini 2.5 Pro',
    provider: 'google',
    role: 'Reasoning',
    cost: '$3.50/hr',
    ctx: '1M',
    icon: Globe,
    iconClass: 'text-[#4285F4]',
  },
  {
    id: 'codex',
    label: 'Codex',
    provider: 'custom',
    role: 'Code-First',
    cost: '$12/hr',
    ctx: '128K',
    icon: Cpu,
    iconClass: 'text-muted-foreground',
  },
];

const GROUPS: CatalogGroup[] = (() => {
  const verified = ['anthropic', 'openai', 'google'];
  const verifiedGroups = verified.map(p => ({
    label: PROVIDER_LABELS[p]!,
    entries: MODEL_CATALOG.filter(e => e.provider === p),
  }));
  const customEntries = MODEL_CATALOG.filter(e => e.provider === 'custom');
  return [
    ...verifiedGroups,
    ...(customEntries.length > 0
      ? [{ label: 'Custom', entries: customEntries }]
      : []),
  ];
})();

function findEntry(id: string): CatalogEntry {
  return MODEL_CATALOG.find(e => e.id === id) ?? MODEL_CATALOG[0]!;
}

/* ─── Model dropdown ───────────────────────────────────── */

function ModelDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const selected = findEntry(value);
  const SelectedIcon = selected.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-3 w-full rounded-md border border-border/60 bg-input px-3 h-10 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors hover:bg-tertiary/30"
        >
          <SelectedIcon
            size={15}
            strokeWidth={STROKE_WIDTH}
            className={selected.iconClass}
          />
          <div className="flex flex-col items-start flex-1 min-w-0">
            <span className="text-sm font-medium leading-none truncate">
              {selected.label}
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight truncate">
              {selected.role} · {selected.ctx} ctx · {selected.cost}
            </span>
          </div>
          <ChevronDown
            size={14}
            strokeWidth={STROKE_WIDTH}
            className="opacity-50 shrink-0"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {GROUPS.map((group, groupIdx) => (
            <div key={group.label}>
              {groupIdx > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/80 py-1.5">
                {group.label}
              </DropdownMenuLabel>
              {group.entries.map(entry => {
                const Icon = entry.icon;
                return (
                  <DropdownMenuRadioItem
                    key={entry.id}
                    value={entry.id}
                    className="flex-col items-start gap-0.5 py-2 pr-3"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Icon
                        size={13}
                        strokeWidth={STROKE_WIDTH}
                        className={entry.iconClass}
                      />
                      <span className="text-sm font-medium">{entry.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground ml-5">
                      <span>{entry.role}</span>
                      <span className="opacity-50">·</span>
                      <span>{entry.cost}</span>
                      <span className="opacity-50">·</span>
                      <span>{entry.ctx} ctx</span>
                    </div>
                  </DropdownMenuRadioItem>
                );
              })}
            </div>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ─── Constants ───────────────────────────────────── */

const COMMIT_OPTIONS: {
  value: CommitAuthority;
  label: string;
  description: string;
}[] = [
  {
    value: 'REVIEW_ONLY',
    label: 'Review',
    description: 'All changes need your approval before merge.',
  },
  {
    value: 'AUTO_MERGE',
    label: 'Auto-Merge',
    description: 'Approved diffs merge after a 5-min review window.',
  },
  {
    value: 'DIRECT_MAIN',
    label: 'Direct Push',
    description: 'Pushes directly to main — no human review.',
  },
];

const PERMISSION_ROWS: {
  key: 'writeAccess' | 'writeMessages' | 'installDeps';
  label: string;
  description: string;
}[] = [
  {
    key: 'writeAccess',
    label: 'Write files',
    description: 'Can modify project source code.',
  },
  {
    key: 'writeMessages',
    label: 'Send messages',
    description: 'Can post in channels and DMs.',
  },
  {
    key: 'installDeps',
    label: 'Install dependencies',
    description: 'Can run npm/bun install and edit lockfiles.',
  },
];

function tokenCostLabel(tokens: number): string {
  return `~$${(tokens * COST_PER_TASK).toFixed(2)} / task`;
}

function pctOfRange(v: number): number {
  return Math.round(((v - MIN_TOKENS) / (MAX_TOKENS - MIN_TOKENS)) * 100);
}

/* ─── Section helper ───────────────────────────────────── */

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div>
        <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </h3>
        {description && (
          <p className="text-[10px] text-muted-foreground/80 mt-1 leading-snug">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

/* ─── Main component ───────────────────────────────────── */

type ControlMatrixProps = {
  agent: Agent;
  onTerminate?: (agentId: string) => void;
};

/**
 * Agent control matrix — model dropdown, permissions, commit authority, thinking budget.
 * @param agent - Agent to configure
 * @param onTerminate - Called when termination is requested
 */
export function ControlMatrix({ agent, onTerminate }: ControlMatrixProps) {
  const initial = getPermissions(agent.id);
  const toast = useToast();
  const [permissions, setLocalPermissions] = useState<Permissions>(initial);
  const [editOpen, setEditOpen] = useState(false);

  const persist = (next: Permissions, label: string) => {
    setLocalPermissions(next);
    setPermissions(agent.id, next);
    toast({ title: label });
  };

  const set = <K extends keyof Permissions>(
    key: K,
    value: Permissions[K],
  ) => {
    persist({ ...permissions, [key]: value }, fieldLabel(key));
  };

  const currentCommit = COMMIT_OPTIONS.find(
    o => o.value === permissions.commitAuthority,
  );

  return (
    <div className="p-3 space-y-5">

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Manage</h2>
          <div className="flex items-center gap-1.5">
            <Avatar size="sm" name={agent.name} className="size-5" />
            <span className="text-xs text-foreground">{agent.name}</span>
            <button
              onClick={() => setEditOpen(true)}
              aria-label="Edit agent"
              className="ml-1 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-hover-tint transition-colors"
            >
              <Pencil size={12} strokeWidth={STROKE_WIDTH} />
            </button>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground leading-snug">
          Configure this agent&apos;s model, permissions, and execution behavior.
        </p>
      </div>

      {/* AI Model */}
      <Section title="AI Model">
        <ModelDropdown
          value={permissions.modelEngine}
          onChange={id => set('modelEngine', id)}
        />
      </Section>

      {/* Permissions */}
      <Section title="Permissions">
        <div className="rounded-md border border-border/40 divide-y divide-border/40">
          {PERMISSION_ROWS.map(({ key, label: rowLabel, description: rowDesc }) => {
            const isOn = permissions[key];
            return (
              <div
                key={key}
                className="flex items-center justify-between gap-3 px-3 py-2.5"
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium text-foreground leading-tight">
                    {rowLabel}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                    {rowDesc}
                  </span>
                </div>
                <Switch checked={isOn} onCheckedChange={v => set(key, v)} />
              </div>
            );
          })}
        </div>
      </Section>

      {/* Commit Authority */}
      <Section
        title="Commit Authority"
        description={currentCommit?.description}
      >
        <SegmentedControl
          options={COMMIT_OPTIONS.map(o => ({
            value: o.value,
            label: o.label,
          }))}
          value={permissions.commitAuthority}
          onChange={v => set('commitAuthority', v as CommitAuthority)}
          size="sm"
        />
      </Section>

      {/* Thinking Budget */}
      <Section title="Thinking Budget">
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-fustat text-foreground tabular-nums">
              {permissions.maxTokens.toLocaleString()}{' '}
              <span className="text-[10px] text-muted-foreground">tok</span>
            </span>
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {pctOfRange(permissions.maxTokens)}% of range
            </span>
          </div>
          <Slider
            value={[permissions.maxTokens]}
            min={MIN_TOKENS}
            max={MAX_TOKENS}
            step={TOKEN_STEP}
            onValueChange={([v = permissions.maxTokens]) =>
              set('maxTokens', v)
            }
            aria-label="Thinking budget in tokens"
          />
          <p className="text-[10px] text-muted-foreground">
            {tokenCostLabel(permissions.maxTokens)} estimated
          </p>
        </div>
      </Section>

      {/* Danger zone */}
      <div className="rounded-md border border-chart-5/30 bg-chart-5/5 p-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <AlertTriangle
            size={12}
            strokeWidth={STROKE_WIDTH}
            className="text-chart-5"
          />
          <span className="text-[10px] font-medium text-chart-5 uppercase tracking-wider">
            Danger zone
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground leading-snug">
          Termination immediately stops all work, revokes all permissions, and
          discards unsaved progress.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="w-full border-chart-5/60 text-chart-5 hover:bg-chart-5/10"
          onClick={() => onTerminate?.(agent.id)}
        >
          Terminate agent execution
        </Button>
      </div>

      <AgentEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        agent={agent}
      />

    </div>
  );
}

function fieldLabel(field: keyof Permissions): string {
  const map: Record<keyof Permissions, string> = {
    modelEngine: 'Model updated',
    writeAccess: 'Write access updated',
    writeMessages: 'Messaging updated',
    installDeps: 'Install permissions updated',
    commitAuthority: 'Commit authority updated',
    maxTokens: 'Thinking budget updated',
  };
  return map[field] ?? 'Permissions updated';
}
