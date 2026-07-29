import { useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { agents } from "@/api/agents";
import { listProjects, loadProject } from "@/flows/projects/crud";
import { useAgentsListVersion } from "@/flows/agents/runtime";
import { useProjectsListVersion } from "@/flows/projects/runtime";
import type { Agent, Project } from "@/types/electron";
import type { CenterBreadcrumbState } from "@/models/ui";

export function useCenterBreadcrumb(): CenterBreadcrumbState {
  const { pathname } = useLocation();
  const { agentId, projectId } = useParams();
  const agentsVersion = useAgentsListVersion();
  const projectsVersion = useProjectsListVersion();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [agentProjects, setAgentProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!agentId) {
      setAgent(null);
      setAgentProjects([]);
      return;
    }
    let cancelled = false;
    Promise.all([agents.get(agentId), listProjects()])
      .then(([nextAgent, nextProjects]) => {
        if (cancelled) return;
        setAgent(nextAgent);
        setAgentProjects(nextProjects);
      })
      .catch(() => {
        if (cancelled) return;
        setAgent(null);
        setAgentProjects([]);
      });
    return () => {
      cancelled = true;
    };
  }, [agentId, agentsVersion, projectsVersion]);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      return;
    }
    let cancelled = false;
    loadProject(projectId)
      .then((nextProject) => {
        if (cancelled) return;
        setProject(nextProject);
      })
      .catch(() => {
        if (cancelled) return;
        setProject(null);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, projectsVersion]);

  if (pathname === "/landing" || pathname === "/") {
    return { segments: null, context: null };
  }
  if (pathname === "/agents" || pathname.startsWith("/agents/")) {
    const currentAgent = agent?.id === agentId ? agent : null;
    return {
      segments: agentId
        ? [{ label: "Agent", clickable: false }, { label: currentAgent?.name ?? agentId }]
        : [{ label: "Agent" }],
      context: agentId && currentAgent
        ? { kind: "agent", agent: currentAgent, projects: agentProjects }
        : null,
    };
  }
  if (pathname === "/projects" || pathname.startsWith("/projects/")) {
    const currentProject = project?.id === projectId ? project : null;
    return {
      segments: projectId
        ? [{ label: "Projects", href: "/projects" }, { label: currentProject?.name ?? projectId }]
        : [{ label: "Projects" }],
      context: projectId && currentProject
        ? { kind: "project", project: currentProject }
        : null,
    };
  }
  if (pathname === "/hive") {
    return { segments: [{ label: "Meta Hive" }], context: null };
  }
  if (pathname === "/remote") {
    return { segments: [{ label: "Remote" }], context: null };
  }
  return {
    segments: [{ label: "Landing", href: "/landing" }],
    context: null,
  };
}
