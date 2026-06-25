/**
 * Agent status indicator dot with pulse/spinner for active states.
 */
import type { AgentStatus } from '@/data/agents/interface';
import { Loader2 } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';

type StatusDotProps = {
  status: AgentStatus;
  className?: string;
};

const colorMap: Record<AgentStatus, string> = {
  EXECUTING:      'bg-chart-2',
  COMPILING:      'bg-chart-3',
  AWAITING_HUMAN: 'bg-chart-1',
  IDLE:           'bg-muted-foreground/40',
  ERROR_LOOP:     'bg-chart-5',
};

/**
 * Agent status indicator dot with pulse/spinner for active states.
 * Used by agent list items and swarm roster.
 * @param status - Agent status: EXECUTING, COMPILING, AWAITING_HUMAN, IDLE, ERROR_LOOP
 * @param className - Additional CSS classes
 */
export function StatusDot({ status, className = '' }: StatusDotProps) {
  if (status === 'COMPILING') {
    return (
      <Loader2
        size={10}
        strokeWidth={STROKE_WIDTH}
        className={`shrink-0 animate-spin text-chart-3 ${className}`}
      />
    );
  }

  const pulse =
    status === 'EXECUTING' ? 'pulse-executing'
    : status === 'ERROR_LOOP' ? 'pulse-error'
    : '';

  return (
    <span
      className={`inline-block size-2 rounded-full shrink-0 ${colorMap[status]} ${pulse} ${className}`}
      aria-label={status}
    />
  );
}