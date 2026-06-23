import { AccordionItem, AccordionHeader } from './AccordionItem';
import { AgentListItem } from './AgentListItem';
import { listAccordionAgents } from '@/data/left-nav/store';
import { mainNavItems } from '@/data/left-nav';
import { STROKE_WIDTH } from '@/lib/constants';

type AccordionCoreProps = {
  currentView?: string;
  onItemClick?: (id: string) => void;
  onAgentClick?: (id: string) => void;
};

function getIcon(id: string) {
  const item = mainNavItems.find(n => n.id === id);
  if (!item) return undefined;
  return <item.icon size={12} strokeWidth={STROKE_WIDTH} />;
}

export function AccordionCore({ currentView, onItemClick, onAgentClick }: AccordionCoreProps) {
  const accordionAgents = listAccordionAgents();

  return (
    <div className="py-1">
      <AccordionHeader
        label="Projects"
        icon={getIcon('projects')}
        active={currentView === 'projects'}
        onClick={() => onItemClick?.('projects')}
      />

      <AccordionHeader
        label="Tickets"
        icon={getIcon('tickets')}
        active={currentView === 'tickets'}
        onClick={() => onItemClick?.('tickets')}
      />

      <AccordionHeader
        label="Communications"
        icon={getIcon('communications')}
        active={currentView === 'communications'}
        onClick={() => onItemClick?.('communications')}
      />

      {accordionAgents.length > 0 && (
        <AccordionItem
          label="Employees"
          icon={getIcon('employees')}
          active={currentView === 'employees'}
          onClick={() => onItemClick?.('employees')}
        >
          {accordionAgents.map(agent => <AgentListItem key={agent.id} agent={agent} onClick={onAgentClick} />)}
        </AccordionItem>
      )}

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
