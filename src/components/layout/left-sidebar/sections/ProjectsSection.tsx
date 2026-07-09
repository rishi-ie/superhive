import { useNavigate } from 'react-router-dom';
import { HugeiconsIcon } from "@/components/ui/icon";
import { FolderOpenIcon } from "@hugeicons/core-free-icons";
import { AccordionSection } from '@/components/layout/common/primitives';

interface ProjectItem {
  id: string;
  name: string;
  agentIds: string[];
}

interface ProjectsSectionProps {
  items: ProjectItem[];
}

/**
 * ProjectsSection — flat list of projects in the left sidebar.
 *
 * Each project IS its chat surface — clicking it navigates to /projects/:id
 * where ProjectChatView drives the project-agent's runtime. The project-agent
 * itself is intentionally hidden from the sidebar (it exists only as the
 * runtime backing the project). No sub-rows, no nested agent list.
 *
 * When a project has no linked project-agent (shouldn't happen with the
 * current create flow, but defensible), the accordion body shows a
 * "No assigned agents" placeholder.
 */
export function ProjectsSection({ items }: ProjectsSectionProps) {
  const navigate = useNavigate();

  return (
    <div className="pl-2">
      {items.map((p) => (
        <AccordionSection
          key={p.id}
          label={p.name}
          defaultOpen={false}
          onClick={() => navigate(`/projects/${p.id}`)}
          labelClassName="text-[#9ca3af]"
        >
          {p.agentIds.length === 0 ? (
            <div className="flex items-center gap-2 px-2 py-1.5">
              <HugeiconsIcon icon={FolderOpenIcon} className="size-4 flex-shrink-0 text-[#727272]" />
              <span className="text-xs text-[#727272]">No assigned agents</span>
            </div>
          ) : null}
        </AccordionSection>
      ))}
    </div>
  );
}