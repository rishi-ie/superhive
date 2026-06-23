import { AccordionItem, AccordionHeader } from './AccordionItem';
import { AgentListItem } from './AgentListItem';
import { ProjectListItem } from './ProjectListItem';
import { listAccordionAgents } from '@/data/left-nav/store';
import { listUniversalProjects } from '@/data/universal-projects/store';
import { mainNavItems } from '@/data/left-nav';
import { STROKE_WIDTH } from '@/lib/constants';

type AccordionCoreProps = {
  currentView?: string;
  onItemClick?: (id: string) => void;
  onAgentClick?: (id: string) => void;
  onProjectClick?: (projectId: string, workspaceId: string) => void;
};

function getIcon(id: string) {
  const item = mainNavItems.find(n => n.id === id);
  if (!item) return undefined;
  return <item.icon size={12} strokeWidth={STROKE_WIDTH} />;
}

export function AccordionCore({ currentView, onItemClick, onAgentClick, onProjectClick }: AccordionCoreProps) {
  const accordionAgents = listAccordionAgents();
  const projects = listUniversalProjects();

  return (
    <div className="py-1">
      <AccordionItem
        label="Projects"
        icon={getIcon('projects')}
        active={currentView === 'universal-projects'}
        onClick={() => onItemClick?.('universal-projects')}
      >
        {projects.map(project => (
          <ProjectListItem
            key={project.id}
            id={project.id}
            name={project.title}
            onClick={(id) => onProjectClick?.(id, project.workspaceId)}
          />
        ))}
      </AccordionItem>

      <AccordionItem
        label="Employees"
        icon={getIcon('employees')}
        active={currentView === 'universal-employees'}
        onClick={() => onItemClick?.('universal-employees')}
      >
        {accordionAgents.map(agent => (
          <AgentListItem key={agent.id} agent={agent} onClick={onAgentClick} />
        ))}
      </AccordionItem>

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
