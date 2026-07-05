import { Bot } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ChevronRightIcon } from "@/components/common/icons/ChevronRightIcon";

interface ChatHeaderProps {
  categoryLabel: string;
  agentName: string;
  sessionName: string;
}

export function ChatHeader({ categoryLabel, agentName, sessionName }: ChatHeaderProps) {
  return (
    <div className="flex h-12 items-center border-b border-[#252525] px-4">
      <Breadcrumb className="flex-1">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              asChild
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <Link to="/">{categoryLabel}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRightIcon />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink
              asChild
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <Link to="/">{agentName}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRightIcon />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Bot className="size-3 text-[#7c3aed]" />
              {sessionName}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
