/**
 * Dashboard Inbox tab — global REVIEW tickets across all workspaces.
 */
import { useState } from 'react';
import { BulkActionBar } from '@/components/right-auxiliary/shared/BulkActionBar';
import { EmptyState } from '@/components/right-auxiliary/shared/EmptyState';
import { FilterChips } from '@/components/right-auxiliary/shared/FilterChips';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { listUniversalTickets, markTicketDone, snoozeTicket } from '@/data/tickets/store';
import { useToast } from '@/lib/toast-context';

type DashboardInboxProps = {
  onTicketClick?: (id: string) => void;
};

const FILTER_CHIPS = [
  { id: 'all',     label: 'All' },
  { id: 'tickets', label: 'Tickets' },
];

type InboxItem = {
  id: string;
  kind: 'ticket';
  title: string;
  priority: string;
  refId: string;
};

/**
 * Dashboard Inbox tab — global REVIEW tickets across all workspaces.
 * @param onTicketClick - Called when a ticket is clicked
 */
export function DashboardInbox({ onTicketClick }: DashboardInboxProps) {
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<InboxItem[]>(() =>
    listUniversalTickets()
      .filter(t => t.status === 'REVIEW')
      .map(t => ({
        id: t.id,
        kind: 'ticket' as const,
        title: t.title,
        priority: t.priority,
        refId: t.id,
      }))
  );
  const toast = useToast();

  const filtered = filter === 'all' ? items : items.filter(i => i.kind === filter);

  const dismiss = (id: string, label: string, refId: string, done = false) => {
    if (done) markTicketDone(refId);
    else snoozeTicket(refId);
    toast({ title: label });
    setItems(prev => prev.filter(i => i.id !== id));
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const markAllDone = () => {
    const count = selected.size;
    for (const id of selected) {
      const item = items.find(i => i.id === id);
      if (item) markTicketDone(item.refId);
    }
    toast({ title: `Marked ${count} done` });
    setItems(prev => prev.filter(i => !selected.has(i.id)));
    setSelected(new Set());
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 shrink-0 space-y-2">
        <FilterChips
          chips={FILTER_CHIPS}
          selected={filter}
          onChange={setFilter}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-3">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<CheckCircle size={28} strokeWidth={1.5} />}
            title="All caught up"
            description="Nothing needs your attention right now"
          />
        ) : (
          <div className="space-y-1 py-1">
            {filtered.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-2 rounded-md border border-border/40 hover:bg-hover-tint transition-colors group"
              >
                <Checkbox
                  checked={selected.has(item.id)}
                  onCheckedChange={() => toggle(item.id)}
                />
                <button
                  onClick={() => onTicketClick?.(item.refId)}
                  className="flex-1 text-left min-w-0"
                >
                  <div className="text-xs text-foreground truncate">{item.title}</div>
                  <div className="text-[9px] text-muted-foreground">{item.priority} · {item.id}</div>
                </button>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismiss(item.id, 'Snoozed', item.refId)}
                  >
                    Snooze
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismiss(item.id, 'Done', item.refId, true)}
                  >
                    Done
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BulkActionBar
        count={selected.size}
        onClear={() => setSelected(new Set())}
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllDone}
          >
            Mark all done
          </Button>
        }
      />
    </div>
  );
}
