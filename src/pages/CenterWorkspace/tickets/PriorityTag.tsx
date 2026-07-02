/**
 * Colored priority badge (HIGH/MEDIUM/LOW).
 */
import type { Priority } from '@/data/ticket/store';

/**
 * @param priority - Priority level to display
 */
export function PriorityTag({ priority }: { priority: Priority }) {
  const config: Record<Priority, { label: string; className: string }> = {
    HIGH:   { label: 'HIGH',   className: 'bg-chart-5/15 text-chart-5 border-chart-5/40' },
    MEDIUM: { label: 'MEDIUM', className: 'bg-chart-3/15 text-chart-3 border-chart-3/40' },
    LOW:    { label: 'LOW',    className: 'bg-secondary/40 text-muted-foreground border-border' },
  };
  const cfg = config[priority];
  return (
    <span className={`inline-flex items-center text-[9px] font-medium uppercase tracking-wider rounded border px-1.5 py-0.5 ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}
