import { useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { agents } from "@/api/agents";

export interface BreadcrumbSegment {
  label: string;
  href?: string;
}

export function useCenterBreadcrumb(): BreadcrumbSegment[] | null {
  const { pathname } = useLocation();
  const { agentId, projectId } = useParams();
  const [agentName, setAgentName] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) return;
    agents.get(agentId).then((a) => {
      setAgentName(a?.name ?? agentId);
    });
  }, [agentId]);

  if (pathname === "/landing" || pathname === "/") {
    return null;
  }
  if (pathname === "/agents" || pathname.startsWith("/agents/")) {
    return agentId
      ? [{ label: "Agents", href: "/agents" }, { label: agentName ?? agentId }]
      : [{ label: "Agents" }];
  }
  if (pathname === "/projects" || pathname.startsWith("/projects/")) {
    return projectId
      ? [{ label: "Projects", href: "/projects" }, { label: projectId }]
      : [{ label: "Projects" }];
  }
  if (pathname === "/hive") {
    return [{ label: "Meta Hive" }];
  }
  if (pathname === "/remote") {
    return [{ label: "Remote" }];
  }
  return [{ label: "Landing", href: "/landing" }];
}
