import { useNavigate } from 'react-router-dom';
import { Icon } from "@/components/ui/icon";
import { UserIcon } from "@phosphor-icons/react";
import { HugeIcon } from "@/components/ui/huge-icon";
import { Folder01Icon } from "@hugeicons/core-free-icons";
import { AccordionSection } from '@/components/layout/common/primitives';
import { AgentRow } from '@/components/layout/common/primitives/AgentRow';
import { goToAgent, goToProject } from '@/flows/navigation';
import type { Agent } from '@/types/electron';

interface ProjectItem {
  id: string;
  name: string;
  agentIds: string[];
}

interface ProjectsSectionProps {
  items: ProjectItem[];
  agents: Agent[];
}

export function ProjectsSection({ items, agents }: ProjectsSectionProps) {
  const navigate = useNavigate();

  return (
    <div>
      {items.map((p) => {
        const assignedAgents = agents.filter(
          (a) => p.agentIds.includes(a.id) && a.agentKind !== 'project-coordinator'
        );

          return (
            <AccordionSection
              key={p.id}
              label={p.name}
              defaultOpen={false}
              labelClassName="text-sidebar-btn-text"
              leadingIcon={<HugeIcon icon={Folder01Icon} size={16} className="size-4 flex-shrink-0" />}
              swapLeadingOnHover={true}
              onClick={() => goToProject(navigate, p.id)}
            >
            {assignedAgents.length > 0 ? (
              assignedAgents.map((a) => (
                <AgentRow
                  key={a.id}
                  name={a.name}
                  showStatus={false}
                  compact={true}
                  onClick={() => goToAgent(navigate, a.id)}
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
