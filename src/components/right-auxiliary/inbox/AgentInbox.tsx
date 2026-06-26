/**
 * Agent Inbox tab — shows REVIEW tickets needing user input.
 */
import { useState } from 'react';
import { FilterChips } from '../shared/FilterChips';
import { BulkActionBar } from '../shared/BulkActionBar';
import { EmptyState } from '../shared/EmptyState';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { listUniversalTickets } from '@/data/tickets/store';
import { useToast } from '@/lib/toast-context';

type AgentInboxProps = {
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
  timestamp: string;
  refId: string;
};

/**
 * Agent Inbox tab — REVIEW tickets needing user input.
 * @param onTicketClick - Called when a ticket is clicked
 */
export function AgentInbox({ onTicketClick }: AgentInboxProps) {
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<InboxItem[]>(() => {
    const tickets = listUniversalTickets().filter(t => t.status === 'REVIEW');
    return tickets.map(t => ({
      id: `ticket-${t.id}`,
      kind: 'ticket' as const,
      title: t.title,
      timestamp: t.id,
      refId: t.id,
    }));
  });
  const toast = useToast();

  const filtered = filter === 'all' ? items : items.filter(i => i.kind === filter);

  const dismiss = (id: string, label: string) => {
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
                className="flex items-center gap-2 p-2 rounded-md border border-border/40 hover:bg-white/5 transition-colors group"
              >
                <Checkbox
                  checked={selected.has(item.id)}
                  onCheckedChange={() => toggle(item.id)}
                />
                <div className="flex items-center gap-1.5 text-[9px] shrink-0">
                  {item.kind === 'ticket' && (
                    <span className="font-fustat text-muted-foreground">TKT</span>
                  )}
                </div>
                <button
                  onClick={() => item.kind === 'ticket' && onTicketClick?.(item.refId)}
                  className="flex-1 text-left min-w-0"
                >
                  <div className="text-xs text-foreground truncate">{item.title}</div>
                  <div className="text-[9px] text-muted-foreground">{item.timestamp}</div>
                </button>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismiss(item.id, 'Snoozed')}
                  >
                    Snooze
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismiss(item.id, 'Done')}
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
