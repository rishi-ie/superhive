import { Link } from 'react-router-dom';
import { Bot } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import type { Agent } from '@/storage/types';

const STATUS_COLORS: Record<string, string> = {
  idle: 'bg-muted text-muted-foreground',
  running: 'bg-green-500/20 text-green-400',
  thinking: 'bg-yellow-500/20 text-yellow-400',
  stopped: 'bg-muted text-muted-foreground',
  error: 'bg-red-500/20 text-red-400',
};

interface AgentChatHeaderProps {
  agent: Agent;
}

export function AgentChatHeader({ agent }: AgentChatHeaderProps) {
  return (
    <div className="flex h-12 items-center justify-between border-b border-[#252525] px-4">
      <Breadcrumb className="flex-1">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              asChild
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <Link to="/agents">Agent view</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRightIcon />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Bot className="size-3 text-[#7c3aed]" />
              {agent.name}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-2">
        {agent.role && (
          <Badge variant="secondary" className="text-[10px]">
            {agent.role}
          </Badge>
        )}
        <Badge
          variant="secondary"
          className={`text-[10px] ${STATUS_COLORS[agent.status] ?? ''}`}
        >
          {agent.status}
        </Badge>
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
