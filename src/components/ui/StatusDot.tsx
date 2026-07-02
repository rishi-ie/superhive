/**
 * Agent status indicator dot with pulse/spinner for active states.
 */
import type { AgentStatus } from '@/data/agent/interface';
import { Loader2 } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';

type StatusDotProps = {
  status: AgentStatus;
  size?: 'xs' | 'sm';
  className?: string;
};

const colorMap: Record<AgentStatus, string> = {
  EXECUTING:      'bg-chart-2',
  COMPILING:      'bg-chart-3',
  AWAITING_HUMAN: 'bg-chart-1',
  IDLE:           'bg-muted-foreground/40',
  ERROR_LOOP:     'bg-chart-5',
};

const sizeClassMap: Record<'xs' | 'sm', string> = {
  xs: 'size-1.5',
  sm: 'size-2',
};

/**
 * Agent status indicator dot with pulse/spinner for active states.
 * @param status - Agent status: EXECUTING, COMPILING, AWAITING_HUMAN, IDLE, ERROR_LOOP
 * @param size - Dot size: xs (1.5) or sm (2, default)
 * @param className - Additional CSS classes
 */
export function StatusDot({ status, size = 'sm', className = '' }: StatusDotProps) {
  if (status === 'COMPILING') {
    return (
      <Loader2
        size={8}
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
      className={`inline-block rounded-full shrink-0 ${sizeClassMap[size]} ${colorMap[status]} ${pulse} ${className}`}
      aria-label={status}
    />
  );
}
