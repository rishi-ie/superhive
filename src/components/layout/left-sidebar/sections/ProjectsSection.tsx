import { useNavigate } from 'react-router-dom';
import { Icon } from "@/components/ui/icon";
import { CircleNotchIcon, PushPinIcon, UserIcon } from '@phosphor-icons/react';
import { HugeIcon } from '@/components/ui/huge-icon';
import { EllipsisIcon, Folder01Icon, Folder02Icon } from '@hugeicons/core-free-icons';
import { AccordionSection } from '@/components/layout/common/primitives';
import { AgentRow } from '@/components/layout/common/primitives/AgentRow';
import { goToAgent, goToProject } from '@/flows/navigation';
import { removeAgentFromProject } from '@/flows/projects/crud';
import type { Agent } from '@/types/electron';

export interface ProjectItem {
  id: string;
  name: string;
  agentIds: string[];
}

interface ProjectsSectionProps {
  items: ProjectItem[];
  agents: Agent[];
  workingIds: Set<string>;
  completedIds: Set<string>;
  pinnedProjectIds: Set<string>;
  coordinatorStates: Map<string, 'working' | 'completed'>;
  onOpen: (id: string) => void;
  onToggleProjectPin: (id: string) => void;
}

export function ProjectsSection({ items, agents, workingIds, completedIds, pinnedProjectIds, coordinatorStates, onOpen, onToggleProjectPin }: ProjectsSectionProps) {
  const navigate = useNavigate();

  return (
    <div>
      {items.map((p) => {
        const assignedAgents = agents.filter(
          (a) => p.agentIds.includes(a.id) && a.agentKind !== 'project-coordinator'
        );
        const coordinator = agents.find((agent) => p.agentIds.includes(agent.id) && agent.agentKind === 'project-coordinator')
        const coordinatorState = coordinator ? coordinatorStates.get(coordinator.id) : undefined

          return (
            <AccordionSection
              key={p.id}
              label={p.name}
              defaultOpen={false}
              labelClassName="font-medium text-sidebar-btn-text-l"
              leadingIcon={<HugeIcon icon={Folder01Icon} size={16} className="size-4" />}
              openLeadingIcon={<HugeIcon icon={Folder02Icon} size={16} className="size-4" />}
              trailing={coordinatorState === 'working' ? <Icon icon={CircleNotchIcon} weight="bold" className="size-4 animate-[spin_1.8s_linear_infinite] text-muted-foreground" /> : coordinatorState === 'completed' ? <span className="size-2 rounded-full bg-blue-500" /> : null}
              hoverActions={coordinatorState !== 'working' ? <><span className="flex size-6 cursor-default items-center justify-center rounded-icon text-muted-foreground/60 transition-colors hover:text-foreground"><HugeIcon icon={EllipsisIcon} size={16} className="size-4" /></span><button type="button" aria-label={pinnedProjectIds.has(p.id) ? `Unpin ${p.name}` : `Pin ${p.name}`} onClick={(event) => { event.stopPropagation(); onToggleProjectPin(p.id) }} className="flex size-6 cursor-default items-center justify-center rounded-icon text-muted-foreground/60 transition-colors hover:text-foreground"><Icon icon={PushPinIcon} className="size-4" weight={pinnedProjectIds.has(p.id) ? 'fill' : 'regular'} /></button></> : undefined}
              onClick={() => goToProject(navigate, p.id)}
            >
            {assignedAgents.length > 0 ? (
              assignedAgents.map((a) => (
                <AgentRow
                  key={a.id}
                  name={a.name}
                  working={workingIds.has(a.id)}
                  completed={completedIds.has(a.id)}
                  onClick={() => { onOpen(a.id); goToAgent(navigate, a.id) }}
                  onMore={() => {
                    if (window.confirm(`Remove ${a.name} from ${p.name}?`)) void removeAgentFromProject({ projectId: p.id, agentId: a.id })
                  }}
                />
              ))
            ) : (
              <div className="flex items-center gap-stack px-row py-1.5">
                <Icon icon={UserIcon} className="size-4 flex-shrink-0 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">No assigned agents</span>
              </div>
            )}
          </AccordionSection>
        );
      })}
    </div>
  );
}
