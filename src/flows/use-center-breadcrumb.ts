import { useParams, useLocation } from "react-router-dom";

export interface BreadcrumbSegment {
  label: string;
  href?: string;
}

export function useCenterBreadcrumb(): BreadcrumbSegment[] {
  const { pathname } = useLocation();
  const { agentId, projectId } = useParams();

  if (pathname === "/") {
    return [{ label: "Home" }];
  }
  if (pathname === "/hive") {
    return [{ label: "Home", href: "/" }, { label: "Meta Hive" }];
  }
  if (pathname === "/agents" || pathname.startsWith("/agents/")) {
    return [
      { label: "Home", href: "/" },
      { label: "Agents", href: "/agents" },
      ...(agentId ? [{ label: agentId }] : []),
    ];
  }
  if (pathname === "/projects" || pathname.startsWith("/projects/")) {
    return [
      { label: "Home", href: "/" },
      { label: "Projects", href: "/projects" },
      ...(projectId ? [{ label: projectId }] : []),
    ];
  }
  return [{ label: "Home", href: "/" }];
}
