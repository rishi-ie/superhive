/**
 * Ticket detail center tab — full ticket info + inline manage controls.
 */
import { useState, useEffect } from 'react';
import { ClipboardCheck, Hash, User, Folder, Activity, Save } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { TextInput } from '@/components/ui/TextInput';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/toasts/context';
import { listTickets } from '@/data/project/store';
import { listUniversalTickets, patchTicket } from '@/data/ticket/store';
import type { UniversalTicket, UniversalTicketStatus, Priority, TicketType } from '@/data/ticket/store';
import type { Ticket } from '@/data/project/store';

type TicketDetailViewProps = {
  ticketId: string;
};

const STATUS_OPTIONS = [
  { value: 'BACKLOG',   label: 'Backlog' },
  { value: 'EXECUTING', label: 'Executing' },
  { value: 'REVIEW',    label: 'Review' },
  { value: 'MERGED',    label: 'Merged' },
] as const;

const PRIORITY_OPTIONS = [
  { value: 'HIGH',   label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW',    label: 'Low' },
] as const;

const TYPE_OPTIONS = [
  { value: 'FEATURE',  label: 'Feature' },
  { value: 'BUG',      label: 'Bug' },
  { value: 'REFACTOR', label: 'Refactor' },
  { value: 'INFRA',    label: 'Infra' },
] as const;

export function TicketDetailView({ ticketId }: TicketDetailViewProps) {
  const toast = useToast();
  const [t, setT] = useState<UniversalTicket | null>(null);
  const [projectTicket, setProjectTicket] = useState<Ticket | null>(null);
  const [status, setStatus] = useState<UniversalTicketStatus>('BACKLOG');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [type, setType] = useState<TicketType>('FEATURE');
  const [assignee, setAssignee] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const ticket = listUniversalTickets().find(x => x.id === ticketId) ?? null;
    if (!ticket) {
      setT(null);
      return;
    }
    setT(ticket);
    setStatus(ticket.status);
    setPriority(ticket.priority);
    setType(ticket.type);
    setAssignee(ticket.assignee.name);
    setDescription((ticket as unknown as { description?: string }).description ?? '');
    setDirty(false);
  }, [ticketId]);

  useEffect(() => {
    if (t) {
      const pt = listTickets(t.workspaceId).find(x => x.id === ticketId) ?? null;
      setProjectTicket(pt);
    }
  }, [t, ticketId]);

  const markDirty = (updater: () => void) => {
    updater();
    setDirty(true);
  };

  const handleSave = () => {
    if (!t) return;
    setSaving(true);
    const updated = patchTicket(t.id, { status, priority, type, assigneeName: assignee });
    if (updated) {
      toast({ title: 'Saved', description: updated.title });
      setDirty(false);
    } else {
      toast({ title: 'Error', description: 'Failed to save ticket', type: 'error' });
    }
    setSaving(false);
  };

  if (!t) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Ticket not found.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 gap-4 max-w-3xl">
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-md bg-chart-3/15 text-chart-3 shrink-0">
          <ClipboardCheck size={20} strokeWidth={STROKE_WIDTH} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-foreground">{t.title}</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">{t.id} · {t.projectName}</p>
        </div>
        {dirty && (
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save size={12} strokeWidth={STROKE_WIDTH} />
            Save
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            value={status}
            onChange={v => markDirty(() => setStatus(v as UniversalTicketStatus))}
            options={STATUS_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select
            value={priority}
            onChange={v => markDirty(() => setPriority(v as Priority))}
            options={PRIORITY_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select
            value={type}
            onChange={v => markDirty(() => setType(v as TicketType))}
            options={TYPE_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Assignee</Label>
          <TextInput
            value={assignee}
            onChange={e => markDirty(() => setAssignee(e.target.value))}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={e => markDirty(() => setDescription(e.target.value))}
          rows={4}
        />
      </div>

      <div className="grid grid-cols-3 gap-3 pt-2">
        <DetailCard icon={Hash} label="ID" value={t.id} />
        <DetailCard icon={User} label="Assignee" value={t.assignee.name} sub={t.assignee.isAI ? 'AI' : 'Human'} />
        <DetailCard icon={Folder} label="Project" value={t.projectName} sub={projectTicket ? `status: ${projectTicket.status}` : undefined} />
      </div>

      <div className="space-y-1.5 pt-2 border-t border-border/40">
        <Label>Activity</Label>
        <div className="flex items-center gap-2 p-2 rounded-md bg-card/30 text-xs text-muted-foreground">
          <Activity size={12} strokeWidth={STROKE_WIDTH} />
          <span>Ticket created</span>
        </div>
        {t.archivedAt && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-card/30 text-xs text-muted-foreground">
            <Activity size={12} strokeWidth={STROKE_WIDTH} />
            <span>Archived at {new Date(t.archivedAt).toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] uppercase tracking-wider font-normal text-muted-foreground">
      {children}
    </label>
  );
}

function DetailCard({ icon: Icon, label, value, sub }: { icon: typeof Hash; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md border border-border/40 p-2 bg-card/30">
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider">
        <Icon size={10} strokeWidth={STROKE_WIDTH} />
        {label}
      </div>
      <div className="text-xs font-medium text-foreground mt-0.5 truncate">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}
