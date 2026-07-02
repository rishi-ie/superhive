/**
 * Accordion navigation core — renders Projects/Agents sections and static nav headers.
 */
import { AccordionItem, AccordionHeader } from './accordion';
import { AgentListItem } from './AgentListItem';
import { ProjectListItem } from './ProjectListItem';
import { listAgents } from '@/data/agent/store';
import { listUniversalProjects } from '@/data/universal_project/store';
import { mainNavItems } from '@/data/config/left-nav';
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

/**
 * Accordion navigation core — renders Projects/Agents sections and static nav headers.
 * @param currentView - Currently active view id
 * @param onItemClick - Called when nav item is clicked
 * @param onAgentClick - Called when agent in accordion is clicked
 * @param onProjectClick - Called when project is clicked
 */
export function AccordionCore({ currentView, onItemClick, onAgentClick, onProjectClick }: AccordionCoreProps) {
  const projects = listUniversalProjects();
  const agents = listAgents().map(a => ({
    id: a.id,
    name: a.name,
    status: a.status,
    currentTask: a.activeTask,
  }));

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
        label="Agents"
        icon={getIcon('agents')}
        active={currentView === 'universal-agents'}
        onClick={() => onItemClick?.('universal-agents')}
      >
        {agents.map(agent => (
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
        active={currentView === 'channels' || currentView === 'channel'}
        onClick={() => onItemClick?.('communications')}
      />

      <AccordionHeader
        label="Meta Hive"
        icon={getIcon('meta-hive')}
        badge={<span className="text-[9px] text-muted-foreground/60 pr-1">Coming soon</span>}
      />

      <AccordionHeader
        label="Remote"
        icon={getIcon('remote')}
        badge={<span className="text-[9px] text-muted-foreground/60 pr-1">Coming soon</span>}
      />
    </div>
  );
}
