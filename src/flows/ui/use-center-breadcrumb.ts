import { useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { agents } from "@/api/agents";
import { loadProject } from "@/flows/projects/crud/load-project";
import type { BreadcrumbSegment } from "@/models/ui";

export function useCenterBreadcrumb(): BreadcrumbSegment[] | null {
  const { pathname } = useLocation();
  const { agentId, projectId } = useParams();
  const [agentName, setAgentName] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) return;
    agents.get(agentId).then((a) => {
      setAgentName(a?.name ?? agentId);
    });
  }, [agentId]);

  useEffect(() => {
    if (!projectId) return;
    loadProject(projectId).then((p) => {
      setProjectName(p?.name ?? projectId);
    });
  }, [projectId]);

  if (pathname === "/landing" || pathname === "/") {
    return null;
  }
  if (pathname === "/agents" || pathname.startsWith("/agents/")) {
    return agentId
      ? [{ label: "Agent", clickable: false }, { label: agentName ?? agentId }]
      : [{ label: "Agent" }];
  }
  if (pathname === "/projects" || pathname.startsWith("/projects/")) {
    return projectId
      ? [{ label: "Projects", href: "/projects" }, { label: projectName ?? projectId }]
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
