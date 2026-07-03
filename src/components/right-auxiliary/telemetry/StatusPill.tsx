/**
 * Agent status pill — colored badge with icon for agent status (EXECUTING, COMPILING, etc.).
 */
import { StatusDot } from '@/components/ui/StatusDot';
import type { AgentStatus } from '@/data/agents/interface';

/**
 * Agent status pill — colored badge with icon for agent status (EXECUTING, COMPILING, etc.).
 * @param status - Agent status to display
 */
export function StatusPill({ status }: { status: AgentStatus }) {
  const config: Record<AgentStatus, { label: string; className: string }> = {
    EXECUTING:     { label: 'EXECUTING',     className: 'bg-chart-2/20 text-chart-2 border-chart-2/40' },
    COMPILING:     { label: 'COMPILING',     className: 'bg-chart-3/20 text-chart-3 border-chart-3/40' },
    AWAITING_HUMAN:{ label: 'AWAITING_HUMAN',className: 'bg-accent/20 text-accent border-accent/40' },
    IDLE:          { label: 'IDLE',          className: 'bg-muted/20 text-muted-foreground border-muted-foreground/40' },
    ERROR_LOOP:    { label: 'ERROR_LOOP',   className: 'bg-chart-5/20 text-chart-5 border-chart-5/40' },
  };
  const { className } = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-fustat font-medium uppercase tracking-wider ${className}`}>
      <StatusDot status={status} size="xs" />
      {status}
    </span>
  );
}
