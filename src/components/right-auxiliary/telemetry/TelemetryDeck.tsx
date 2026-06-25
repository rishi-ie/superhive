/**
 * Agent telemetry deck — identity, brain usage bar, cost card, last actions, next step.
 */
import { Loader2 } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { getTelemetry, getActionLog, getNextStep, type Agent } from '@/data/agents/store';
import { Avatar } from '@/components/ui/Avatar';

type TelemetryDeckProps = {
  agent: Agent;
};

function heartbeatColor(saturation: number): string {
  if (saturation > 90) return 'bg-chart-1';
  if (saturation > 70) return 'bg-chart-3';
  return 'bg-chart-2';
}

function heartbeatLabel(saturation: number): string {
  if (saturation > 90) return '— Overloaded';
  if (saturation > 70) return '— Elevated';
  return '— Healthy';
}

/**
 * Agent telemetry deck — identity, brain usage bar, cost card, last actions, next step.
 * @param agent - Agent to display telemetry for
 */
export function TelemetryDeck({ agent }: TelemetryDeckProps) {
  const telemetry = getTelemetry(agent.id);
  const actions = getActionLog(agent.id);
  const nextStep = getNextStep(agent.id);
  const budgetRemaining = (telemetry.budget - telemetry.sessionCost).toFixed(2);

  return (
    <div className="p-3 space-y-4">

      {/* Identity Strip */}
      <div className="flex items-center gap-2">
        <Avatar size="xs" fallback={agent.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)} />
        {agent.status === 'EXECUTING'     && <span className="size-2 rounded-full bg-chart-2 pulse-executing shrink-0" />}
        {agent.status === 'COMPILING'     && <Loader2 size={10} className="animate-spin text-chart-3 shrink-0" strokeWidth={STROKE_WIDTH} />}
        {agent.status === 'AWAITING_HUMAN'&& <span className="size-2 rounded-full bg-chart-1 shrink-0" />}
        {agent.status === 'IDLE'          && <span className="size-2 rounded-full bg-muted-foreground/40 shrink-0" />}
        {agent.status === 'ERROR_LOOP'    && <span className="size-2 rounded-full bg-chart-5 pulse-error shrink-0" />}
        <span className="text-sm font-semibold text-foreground">{agent.name}</span>
        <span className="text-muted-foreground text-xs">·</span>
        <span className="text-xs text-muted-foreground">{agent.role}</span>
        <span className="text-muted-foreground text-xs">·</span>
        <span className="text-xs text-muted-foreground">active <span className="font-fustat">{agent.uptime}</span></span>
      </div>

      {/* Heartbeat Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Brain Usage</span>
          <span className={`text-[10px] font-fustat ${telemetry.contextSaturation > 90 ? 'text-chart-1' : telemetry.contextSaturation > 70 ? 'text-chart-3' : 'text-chart-2'}`}>
            {telemetry.contextSaturation}% {heartbeatLabel(telemetry.contextSaturation)}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-input overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${heartbeatColor(telemetry.contextSaturation)}`}
            style={{ width: `${telemetry.contextSaturation}%` }}
          />
        </div>
      </div>

      {/* Cost Card */}
      <div className="bg-card border border-border rounded-lg px-4 py-3 space-y-1">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-fustat font-bold text-foreground">${telemetry.currentCost.toFixed(4)}</span>
          <span className="text-xs text-muted-foreground">current burn</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="font-fustat">{telemetry.tokensPerSecond} tok/s</span>
          <span>·</span>
          <span className="font-fustat">{telemetry.evolutionLoop} evolutions</span>
          <span>·</span>
          <span className="font-fustat">{telemetry.logicKernelIntegrity}% kernel</span>
        </div>
        <div className="pt-1 border-t border-border flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Session total</span>
          <span className="text-[10px] font-fustat text-foreground">${telemetry.sessionCost.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Budget remaining</span>
          <span className="text-[10px] font-fustat text-chart-2">${budgetRemaining}</span>
        </div>
      </div>

      {/* Last Actions */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Last Actions</span>
        <div className="space-y-1">
          {actions.length === 0 && <span className="text-[10px] text-muted-foreground/60 italic">No recent actions</span>}
          {actions.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-[10px] font-fustat text-muted-foreground/60 shrink-0 mt-0.5">{item.time}</span>
              <span className="text-[10px] text-muted-foreground leading-relaxed">{item.action}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Next Step */}
      <div className="border-t border-border pt-2">
        <span className="text-[10px] text-muted-foreground/60 italic">{nextStep}</span>
      </div>

    </div>
  );
}
