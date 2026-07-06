import { FolderOpen, Plus } from 'lucide-react';
import { AccordionSection, AccordionRow, EmptyCtaButton } from '@/components/layout/common/primitives';

interface ProjectItem {
  id: string;
  name: string;
}

interface ProjectsSectionProps {
  items: ProjectItem[];
}

export function ProjectsSection({ items }: ProjectsSectionProps) {
  return (
    <AccordionSection label="Projects">
      {items.length > 0
        ? items.map((p) => (
            <AccordionRow
              key={p.id}
              icon={<FolderOpen className="size-4 flex-shrink-0" />}
              label={p.name}
            />
          ))
        : <EmptyCtaButton icon={<Plus className="size-4 flex-shrink-0" />} label="New project" />}
    </AccordionSection>
  );
}
