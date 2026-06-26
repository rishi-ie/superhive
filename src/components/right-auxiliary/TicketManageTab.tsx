/**
 * Ticket management tab — status, priority, type, and assignee controls with save/cancel.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { SaveCancelBar } from './shared/SaveCancelBar';
import { ConfirmationModal } from './shared/ConfirmationModal';
import { useToast } from '@/lib/toast-context';
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
  { value: 'INFRA',   label: 'Infra' },
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

/**
 * Ticket management tab — status, priority, type, and assignee controls with save/cancel.
 * @param ticket - Ticket to manage
 * @param agents - Available agents for reassignment
 */
export function TicketManageTab({ ticket, agents }: TicketManageTabProps) {
  const [status, setStatus] = useState<UniversalTicketStatus>(ticket.status);
  const [priority, setPriority] = useState<Priority>(ticket.priority);
  const [type, setType] = useState<TicketType>(ticket.type);
  const [assignee, setAssignee] = useState(ticket.assignee.name);
  const [isDirty, setIsDirty] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const toast = useToast();

  const markDirty = (updater: () => void) => {
    updater();
    setIsDirty(true);
  };

  const handleSave = () => {
    toast({ title: 'Saved', description: ticket.title });
    setIsDirty(false);
  };

  const handleCancel = () => {
    setStatus(ticket.status);
    setPriority(ticket.priority);
    setType(ticket.type);
    setAssignee(ticket.assignee.name);
    setIsDirty(false);
  };

  const handleCloseConfirm = () => {
    setStatus('MERGED');
    setShowCloseModal(false);
    toast({ title: 'Ticket closed', description: ticket.title });
    setIsDirty(true);
  };

  const handleArchiveConfirm = () => {
    setShowArchiveModal(false);
    toast({ title: 'Ticket archived', description: ticket.title });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</label>
          <div className="flex rounded-md border border-border/40 overflow-hidden">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => markDirty(() => setStatus(opt.value))}
                className={`flex-1 py-1.5 text-[10px] font-medium transition-colors ${
                  status === opt.value
                    ? STATUS_SELECTED[opt.value]
                    : 'bg-card text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Priority</label>
          <div className="flex rounded-md border border-border/40 overflow-hidden">
            {PRIORITY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => markDirty(() => setPriority(opt.value))}
                className={`flex-1 py-1.5 text-[10px] font-medium transition-colors ${
                  priority === opt.value
                    ? PRIORITY_SELECTED[opt.value]
                    : 'bg-card text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Type</label>
          <div className="flex rounded-md border border-border/40 overflow-hidden">
            {TYPE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => markDirty(() => setType(opt.value))}
                className={`flex-1 py-1.5 text-[10px] font-medium transition-colors ${
                  type === opt.value
                    ? 'border-chart-1 bg-chart-1/10 text-chart-1'
                    : 'bg-card text-muted-foreground hover:text-foreground hover:bg-white/5'
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
            onChange={(val) => markDirty(() => setAssignee(val))}
            options={agents.map(a => ({ value: a.name, label: a.name }))}
          />
        </div>

        <div className="border-t border-border/40 pt-3 space-y-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setShowCloseModal(true)}
            >
              Close Ticket
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-chart-5 border-chart-5/40 hover:bg-chart-5/10"
              onClick={() => setShowArchiveModal(true)}
            >
              Archive Ticket
            </Button>
          </div>
        </div>
      </div>

      <SaveCancelBar
        onSave={handleSave}
        onCancel={handleCancel}
        disabled={!isDirty}
      />

      {showCloseModal && (
        <ConfirmationModal
          title="Close Ticket"
          description="Mark this ticket as closed? This will set its status to Merged."
          confirmLabel="Close Ticket"
          onConfirm={handleCloseConfirm}
          onCancel={() => setShowCloseModal(false)}
        />
      )}

      {showArchiveModal && (
        <ConfirmationModal
          title="Archive Ticket"
          description="Archive this ticket? It will be hidden from default views."
          confirmLabel="Archive"
          destructive
          confirmText="ARCHIVE"
          onConfirm={handleArchiveConfirm}
          onCancel={() => setShowArchiveModal(false)}
        />
      )}
    </div>
  );
}
