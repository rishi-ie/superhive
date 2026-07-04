import { Link } from 'react-router-dom';
import { FolderOpen } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import type { Project } from '@/storage/types';

interface ProjectChatHeaderProps {
  project: Project;
}

export function ProjectChatHeader({ project }: ProjectChatHeaderProps) {
  const truncatedDesc =
    project.description && project.description.length > 40
      ? project.description.slice(0, 40) + '…'
      : project.description;

  return (
    <div className="flex h-12 items-center justify-between border-b border-[#252525] px-4">
      <Breadcrumb className="flex-1">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              asChild
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <Link to="/projects">Project view</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRightIcon />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <FolderOpen className="size-3 text-[#2563eb]" />
              {project.name}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-2">
        {truncatedDesc && (
          <Badge variant="secondary" className="text-[10px]">
            {truncatedDesc}
          </Badge>
        )}
      </div>
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted-foreground/40"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
