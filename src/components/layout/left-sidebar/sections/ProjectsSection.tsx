import { useNavigate } from 'react-router-dom';
import { AccordionSection } from '@/components/layout/common/primitives';

interface ProjectItem {
  id: string;
  name: string;
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
          {/* Project-agent is implicit — no sub-rows */}
        </AccordionSection>
      ))}
    </div>
  );
}