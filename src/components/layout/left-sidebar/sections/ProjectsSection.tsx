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

function isAgentActive(status: Agent['status']): boolean {
  return status === 'running' || status === 'busy';
}

export function ProjectsSection({ items, agents }: ProjectsSectionProps) {
  const navigate = useNavigate();

  return (
    <>
      {items.map((p) => {
        const projectAgents = agents.filter(a => p.agentIds.includes(a.id));
        return (
          <AccordionSection
            key={p.id}
            label={p.name}
            defaultOpen={false}
            onClick={() => navigate(`/projects/${p.id}`)}
          >
            {projectAgents.length > 0
              ? projectAgents.map((a) => (
                  <AgentRow
                    key={a.id}
                    name={a.name}
                    status={isAgentActive(a.status) ? 'active' : 'idle'}
                    currentAction="Working…"
                    onClick={() => navigate(`/agents/${a.id}`)}
                  />
                ))
              : (
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <HugeiconsIcon icon={FolderOpenIcon} className="size-4 flex-shrink-0 text-[#727272]" />
                    <span className="text-xs text-[#727272]">No agents assigned</span>
                  </div>
                )}
          </AccordionSection>
        );
      })}
    </>
  );
}
