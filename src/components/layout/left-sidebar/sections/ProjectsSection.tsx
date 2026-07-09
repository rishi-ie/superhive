import { useNavigate } from 'react-router-dom';
import { HugeiconsIcon } from "@/components/ui/icon";
import { FolderOpenIcon } from "@hugeicons/core-free-icons";
import { AccordionSection } from '@/components/layout/common/primitives';
import { AgentRow } from '@/components/layout/common/primitives/AgentRow';
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
    <div className="pl-2">
      {items.map((p) => {
        const assignedAgents = agents.filter(
          (a) => p.agentIds.includes(a.id) && a.agentKind !== 'project-coordinator'
        );

        return (
          <AccordionSection
            key={p.id}
            label={p.name}
            defaultOpen={false}
            labelClassName="text-[#9ca3af]"
            onClick={() => navigate(`/projects/${p.id}`)}
          >
            {assignedAgents.length > 0 ? (
              assignedAgents.map((a) => (
                <AgentRow key={a.id} name={a.name} showStatus={false} />
              ))
            ) : (
              <div className="flex items-center gap-2 px-2 py-1.5">
                <HugeiconsIcon icon={FolderOpenIcon} className="size-4 flex-shrink-0 text-[#727272]" />
                <span className="text-xs text-[#727272]">No assigned agents</span>
              </div>
            )}
          </AccordionSection>
        );
      })}
    </div>
  );
}
