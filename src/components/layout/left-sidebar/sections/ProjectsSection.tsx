import { useNavigate } from 'react-router-dom';
import { HugeiconsIcon } from "@/components/ui/icon";
import { CircleIcon, FolderOpenIcon } from "@hugeicons/core-free-icons";
import { AccordionSection } from '@/components/layout/common/primitives';
import { cn } from '@/lib/utils';
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

function statusColor(status: Agent['status']): string {
  switch (status) {
    case 'running':
    case 'busy':
      return 'text-emerald-500';
    case 'initializing':
      return 'text-amber-500';
    case 'error':
      return 'text-destructive';
    case 'stopped':
    case 'idle':
    default:
      return 'text-[#727272]';
  }
}

function statusLabel(status: Agent['status']): string {
  switch (status) {
    case 'initializing': return 'starting';
    case 'running': return 'running';
    case 'busy': return 'busy';
    case 'idle': return 'idle';
    case 'stopped': return 'stopped';
    case 'error': return 'error';
  }
}

/**
 * ProjectsSection — flat list of projects in the left sidebar.
 *
 * Each project IS its chat surface — clicking it navigates to /projects/:id
 * where ProjectChatView drives the project-agent's runtime. The project-agent
 * itself is intentionally hidden from the sidebar (it exists only as the
 * runtime backing the project). No sub-rows, no nested agent list.
 *
 * The accordion body always shows a hint row: the project-agent's runtime
 * status (e.g. "running", "stopped") with a colored dot. Falls back to
 * "No assigned agents" if no project-agent is linked.
 */
export function ProjectsSection({ items, agents }: ProjectsSectionProps) {
  const navigate = useNavigate();

  return (
    <div className="pl-2">
      {items.map((p) => {
        const projectAgent = agents.find(
          (a) => a.agentKind === 'project-coordinator' && p.agentIds.includes(a.id)
        );

        return (
          <AccordionSection
            key={p.id}
            label={p.name}
            defaultOpen={false}
            onClick={() => navigate(`/projects/${p.id}`)}
            labelClassName="text-[#9ca3af]"
          >
            {projectAgent ? (
              <div className="flex items-center gap-2 px-2 py-1.5">
                <HugeiconsIcon
                  icon={CircleIcon}
                  className={cn('size-2 flex-shrink-0', statusColor(projectAgent.status))}
                />
                <span className="text-xs text-[#727272]">
                  Project agent · {statusLabel(projectAgent.status)}
                </span>
              </div>
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