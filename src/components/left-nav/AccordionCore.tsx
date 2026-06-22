import { AccordionItem, AccordionHeader } from './AccordionItem';
import { AgentListItem } from './AgentListItem';
import { accordionAgents } from '@/data/mock/accordion-employees';
import { mainNavItems } from '@/data/left-nav';
import { STROKE_WIDTH } from '@/lib/constants';

type AccordionCoreProps = {
  onItemClick?: (id: string) => void;
};

const projectRows = [
  { id: 'proj-superhive', label: 'Superhive App' },
  { id: 'proj-mumbrane',  label: 'Mumbrane Platform' },
  { id: 'proj-sidharda',  label: 'Sidharda Website' },
];
const ticketRows = [
  { id: 'tkt-1', label: 'Fix auth regression' },
  { id: 'tkt-2', label: 'Update API docs' },
];
const commsRows = [
  { id: 'msg-1', label: 'Team chat' },
  { id: 'msg-2', label: 'Mentions' },
];

function NavRow({ id, label, onItemClick }: { id: string; label: string; onItemClick?: (id: string) => void }) {
  return (
    <button
      onClick={() => onItemClick?.(id)}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
    >
      <span className="flex-1 text-left truncate">{label}</span>
    </button>
  );
}

export function AccordionCore({ onItemClick }: AccordionCoreProps) {
  const getIcon = (id: string) => {
    const item = mainNavItems.find(n => n.id === id);
    if (!item) return undefined;
    return <item.icon size={12} strokeWidth={STROKE_WIDTH} />;
  };

  return (
    <div className="py-1">
      <AccordionItem label="Projects" icon={getIcon('projects')}>
        {projectRows.map(p => <NavRow key={p.id} id={p.id} label={p.label} onItemClick={onItemClick} />)}
      </AccordionItem>

      <AccordionItem label="Employees" icon={getIcon('employees')} defaultOpen>
        {accordionAgents.map(agent => <AgentListItem key={agent.id} agent={agent} onClick={onItemClick} />)}
      </AccordionItem>

      <AccordionItem label="Tickets" icon={getIcon('tickets')}>
        {ticketRows.map(t => <NavRow key={t.id} id={t.id} label={t.label} onItemClick={onItemClick} />)}
      </AccordionItem>

      <AccordionItem label="Communications" icon={getIcon('communications')}>
        {commsRows.map(c => <NavRow key={c.id} id={c.id} label={c.label} onItemClick={onItemClick} />)}
      </AccordionItem>

      <AccordionHeader
        label="Meta Hive"
        icon={getIcon('meta-hive')}
        badge={<span className="text-[9px] text-muted-foreground/60 italic pr-1">Coming soon</span>}
      />

      <AccordionHeader
        label="Remote"
        icon={getIcon('remote')}
        badge={<span className="text-[9px] text-muted-foreground/60 italic pr-1">Coming soon</span>}
      />
    </div>
  );
}