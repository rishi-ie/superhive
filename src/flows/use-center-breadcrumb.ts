import { useParams, useLocation } from "react-router-dom";

export interface BreadcrumbSegment {
  label: string;
  href?: string;
}

export function useCenterBreadcrumb(): BreadcrumbSegment[] | null {
  const { pathname } = useLocation();
  const { agentId, projectId } = useParams();

  if (pathname === "/landing" || pathname === "/") {
    return null;
  }
  if (pathname === "/agents" || pathname.startsWith("/agents/")) {
    return agentId
      ? [{ label: "Agents", href: "/agents" }, { label: agentId }]
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
