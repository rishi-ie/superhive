/**
 * Agent telemetry deck — identity, brain usage bar, last actions, next step.
 */
import { Loader2 } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { getTelemetry, getActionLog, getNextStep, type Agent } from '@/data/agents/store';
import { Avatar } from '@/components/ui/Avatar';

type TelemetryDeckProps = {
  agent: Agent;
  onTicketClick?: (id: string) => void;
};

/**
 * Agent telemetry deck — identity, brain usage bar, last actions, next step.
 * @param agent - Agent to display telemetry for
 */
export function TelemetryDeck({ agent }: TelemetryDeckProps) {
  const telemetry = getTelemetry(agent.id);
  const actions = getActionLog(agent.id);
  const nextStep = getNextStep(agent.id);

  return (
    <div className="p-3 space-y-4">

      {/* Identity Strip */}
      <div className="flex items-center gap-2 flex-wrap">
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
        {agent.activeTask && (
          <>
            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-xs text-muted-foreground italic truncate max-w-[120px]">{agent.activeTask}</span>
          </>
        )}
      </div>

      {/* Brain Usage — minimal */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Brain Usage</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-fustat text-muted-foreground">
              {telemetry.contextSaturation}%
            </span>
            <span className="text-[10px] font-fustat text-muted-foreground">
              {telemetry.tokensPerSecond}K / {telemetry.logicKernelIntegrity}K tokens
            </span>
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-input overflow-hidden">
          <div
            className="h-full rounded-full bg-chart-2 transition-all"
            style={{ width: `${telemetry.contextSaturation}%` }}
          />
        </div>
      </div>

      {/* Last Actions */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Last Actions</span>
        <div className="space-y-1">
          {actions.length === 0 && <span className="text-[10px] text-muted-foreground/60 italic">No recent actions</span>}
          {actions.slice(0, 10).map((item, i) => (
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
