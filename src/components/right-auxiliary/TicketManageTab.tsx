import { useState } from 'react';
import { X } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { Select } from '@/components/ui/Select';
import type { UniversalTicket, UniversalTicketStatus, Priority, TicketType } from '@/data/tickets/store';
import type { Agent } from '@/data/agents/store';

type TicketManageTabProps = {
  ticket: UniversalTicket;
  agents: Agent[];
};

const STATUS_OPTIONS: { value: UniversalTicketStatus; label: string }[] = [
  { value: 'BACKLOG',   label: 'Backlog' },
  { value: 'EXECUTING', label: 'Executing' },
  { value: 'REVIEW',   label: 'Review' },
  { value: 'MERGED',    label: 'Merged' },
];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'HIGH',   label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW',    label: 'Low' },
];

const TYPE_OPTIONS: { value: TicketType; label: string }[] = [
  { value: 'BUG',     label: 'Bug' },
  { value: 'FEATURE', label: 'Feature' },
  { value: 'REFACTOR', label: 'Refactor' },
];

const STATUS_SELECTED: Record<UniversalTicketStatus, string> = {
  BACKLOG:   'border-chart-5 bg-chart-5/10 text-chart-5',
  EXECUTING: 'border-chart-2 bg-chart-2/10 text-chart-2',
  REVIEW:    'border-chart-3 bg-chart-3/10 text-chart-3',
  MERGED:    'border-muted-foreground/40 bg-muted/10 text-muted-foreground',
};

const PRIORITY_SELECTED: Record<Priority, string> = {
  HIGH:   'border-chart-5 bg-chart-5/10 text-chart-5',
  MEDIUM: 'border-chart-3 bg-chart-3/10 text-chart-3',
  LOW:    'border-border bg-secondary/40 text-muted-foreground',
};

export function TicketManageTab({ ticket, agents }: TicketManageTabProps) {
  const [status, setStatus] = useState<UniversalTicketStatus>(ticket.status);
  const [priority, setPriority] = useState<Priority>(ticket.priority);
  const [type, setType] = useState<TicketType>(ticket.type);
  const [assignee, setAssignee] = useState(ticket.assignee.name);

  return (
    <div className="p-3 space-y-4">
      <div className="space-y-1.5">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</label>
        <div className="flex rounded-md border border-border overflow-hidden">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              className={`flex-1 py-1.5 text-[10px] font-medium transition-colors ${
                status === opt.value
                  ? STATUS_SELECTED[opt.value]
                  : 'bg-card text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/30'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Priority</label>
        <div className="flex rounded-md border border-border overflow-hidden">
          {PRIORITY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPriority(opt.value)}
              className={`flex-1 py-1.5 text-[10px] font-medium transition-colors ${
                priority === opt.value
                  ? PRIORITY_SELECTED[opt.value]
                  : 'bg-card text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/30'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Type</label>
        <div className="flex rounded-md border border-border overflow-hidden">
          {TYPE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              className={`flex-1 py-1.5 text-[10px] font-medium transition-colors ${
                type === opt.value
                  ? 'border-chart-1 bg-chart-1/10 text-chart-1'
                  : 'bg-card text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/30'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Assignee</label>
        <Select
          value={assignee}
          onChange={setAssignee}
          options={agents.map(a => ({ value: a.name, label: a.name }))}
        />
      </div>

      <div className="border-t border-border pt-3 space-y-2">
        <div className="flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-md border border-border px-3 py-2 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            Close Ticket
          </button>
          <button
            type="button"
            className="flex-1 rounded-md border border-border px-3 py-2 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            Reopen
          </button>
        </div>
        <button
          type="button"
          className="w-full rounded-md border border-border px-3 py-2 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          Archive
        </button>
      </div>
    </div>
  );
}
