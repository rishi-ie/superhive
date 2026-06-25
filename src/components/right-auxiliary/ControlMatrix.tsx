/**
 * Agent control matrix — model engine, permissions, commit authority, thinking budget.
 */
import { useState } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { STROKE_WIDTH, COST_PER_TASK } from '@/lib/constants';
import { Toggle } from '@/components/ui/Toggle';
import { getPermissions, type Agent, type Permissions } from '@/data/agents/store';
import type { CommitAuthority } from '@/data/agents/interface';

type ControlMatrixProps = {
  agent: Agent;
  onTerminate?: (agentId: string) => void;
};

const ENGINES = [
  { id: 'opus',   label: 'Opus 4.8',  cost: '$18/hr', tag: 'Reasoning'  },
  { id: 'sonnet', label: 'Sonnet 4',  cost: '$3/hr',  tag: 'Balanced'   },
  { id: 'claude', label: 'Claude 3.5',cost: '$6/hr',  tag: 'Concise'    },
  { id: 'codex',  label: 'Codex',     cost: '$12/hr', tag: 'Code-First' },
];

const COMMIT_OPTIONS: { label: string; value: CommitAuthority; description: string }[] = [
  { label: 'Review',      value: 'REVIEW_ONLY',  description: 'All changes need your approval before merge' },
  { label: 'Auto-Merge', value: 'AUTO_MERGE',   description: 'Approved diffs merge after a 5-min review window' },
  { label: 'Direct Push',value: 'DIRECT_MAIN',   description: 'Pushes directly to main — no human review' },
];

const PERMISSION_ROWS: { key: keyof Omit<Permissions, 'modelEngine' | 'commitAuthority' | 'maxTokens'>; label: string; description: string }[] = [
  { key: 'writeAccess',   label: 'WRITE FILES',         description: 'Can modify project files and source code' },
  { key: 'writeMessages', label: 'SEND MESSAGES',       description: 'Can post in team channels and direct messages' },
  { key: 'installDeps',  label: 'INSTALL DEPENDENCIES', description: 'Can run npm/bun install and modify lockfiles' },
];

function getTokenCostLabel(tokens: number): string {
  return `~$${(tokens * COST_PER_TASK).toFixed(2)} / task`;
}

/**
 * Agent control matrix — model engine, permissions, commit authority, thinking budget.
 * @param agent - Agent to configure
 * @param onTerminate - Called when termination is requested
 */
export function ControlMatrix({ agent, onTerminate }: ControlMatrixProps) {
  const initial = getPermissions(agent.id);
  const [permissions, setPermissions] = useState<Permissions>({ ...initial });
  const [sliderValue, setSliderValue] = useState(permissions.maxTokens);

  const set = <K extends keyof Permissions>(key: K, value: Permissions[K]) =>
    setPermissions((prev) => ({ ...prev, [key]: value }));

  const commitDesc = COMMIT_OPTIONS.find((o) => o.value === permissions.commitAuthority)?.description ?? '';

  return (
    <div className="p-3 space-y-4">

      {/* Live Config Summary */}
      <div className="bg-card border border-border rounded-md px-3 py-2 flex items-center gap-2 flex-wrap">
        <span className="text-xs font-fustat text-foreground">{permissions.modelEngine}</span>
        <span className="text-muted-foreground text-xs">·</span>
        <span className={`text-xs font-medium ${permissions.writeAccess ? 'text-chart-2' : 'text-muted-foreground'}`}>
          {permissions.writeAccess ? 'WRITE ON' : 'WRITE OFF'}
        </span>
        <span className="text-muted-foreground text-xs">·</span>
        <span className={`text-xs font-medium ${permissions.commitAuthority === 'DIRECT_MAIN' ? 'text-chart-5' : 'text-muted-foreground'}`}>
          {permissions.commitAuthority === 'REVIEW_ONLY' ? 'REVIEW' : permissions.commitAuthority === 'AUTO_MERGE' ? 'AUTO-MERGE' : 'DIRECT PUSH'}
        </span>
        <span className="text-muted-foreground text-xs">·</span>
        <span className="text-xs font-fustat text-muted-foreground">{permissions.maxTokens.toLocaleString()} tok</span>
      </div>

      {/* Engine Cards */}
      <div className="space-y-1.5">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Model Engine</label>
        <div className="grid grid-cols-2 gap-1.5">
          {ENGINES.map((engine) => {
            const selected = permissions.modelEngine === engine.label;
            return (
              <button
                key={engine.id}
                type="button"
                onClick={() => set('modelEngine', engine.label)}
                className={`flex flex-col items-start rounded-md border px-2.5 py-2 text-left transition-colors ${
                  selected
                    ? 'border-chart-1 bg-chart-1/10'
                    : 'border-border hover:border-muted-foreground/50'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className={`text-xs font-medium font-fustat ${selected ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {engine.label}
                  </span>
                  {selected && <Check size={10} strokeWidth={STROKE_WIDTH} className="text-chart-1" />}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] text-muted-foreground font-fustat">{engine.cost}</span>
                  <span className="text-[9px] text-muted-foreground/60">·</span>
                  <span className="text-[9px] text-chart-3">{engine.tag}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Permissions */}
      <div className="space-y-1.5">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Permissions</label>
        <div className="space-y-1">
          {PERMISSION_ROWS.map(({ key, label: rowLabel, description: rowDesc }) => {
            const isOn = permissions[key] as boolean;
            return (
              <div key={key} className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground">{rowLabel}</div>
                  <div className="text-[10px] text-muted-foreground leading-relaxed">{rowDesc}</div>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <span className={`text-[10px] font-medium ${isOn ? 'text-chart-2' : 'text-muted-foreground/60'}`}>
                    {isOn ? 'ON' : 'OFF'}
                  </span>
                  <Toggle checked={isOn} onChange={(val) => set(key, val)} size="sm" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Commit Authority */}
      <div className="space-y-1.5">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Commit Authority</label>
        <div className="flex rounded-md border border-border overflow-hidden">
          {COMMIT_OPTIONS.map((opt) => {
            const selected = permissions.commitAuthority === opt.value;
            const danger = opt.value === 'DIRECT_MAIN';
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('commitAuthority', opt.value)}
                className={[
                  'flex-1 flex items-center justify-center py-2 text-[10px] font-medium transition-colors',
                  selected && danger ? 'bg-chart-5/20 text-chart-5' :
                  selected ? 'bg-chart-1/20 text-chart-1' :
                  'bg-card text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/30',
                ].filter(Boolean).join(' ')}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed">{commitDesc}</p>
      </div>

      {/* Thinking Budget */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Thinking Budget</label>
          <span className="text-[10px] font-fustat text-foreground">{sliderValue.toLocaleString()} tok</span>
        </div>
        <input
          type="range"
          min={1024}
          max={16384}
          step={512}
          value={sliderValue}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            setSliderValue(val);
            set('maxTokens', val);
          }}
          className="w-full accent-[#e07850] h-1 rounded-full bg-input cursor-pointer"
        />
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground/60 font-fustat">1K</span>
          <span className="text-[10px] text-chart-3 font-fustat">{getTokenCostLabel(sliderValue)} estimated</span>
          <span className="text-[9px] text-muted-foreground/60 font-fustat">16K</span>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border-t border-border pt-3 space-y-2">
        <div className="flex items-center gap-2">
          <AlertTriangle size={12} strokeWidth={STROKE_WIDTH} className="text-chart-5 shrink-0" />
          <span className="text-[10px] font-medium text-chart-5 uppercase tracking-wider">Critical Action</span>
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Termination immediately stops all work, revokes all permissions, and discards unsaved progress.
        </p>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-md border border-chart-5 px-3 py-2 text-sm font-medium text-chart-5 hover:bg-chart-5/10 transition-colors"
          onClick={() => onTerminate?.(agent.id)}
        >
          Terminate Agent Execution
        </button>
      </div>

    </div>
  );
}
