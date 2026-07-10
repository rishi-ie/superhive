import * as React from 'react';
import { HugeiconsIcon } from "@/components/ui/icon";
import { PlusSignIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { AgentListRow } from './AgentListRow';
import { EmptyAgentsState } from './EmptyAgentsState';
import { listAgents } from '@/flows/agents/crud/list-agents';
import { listProjects } from '@/flows/projects/crud/list-projects';
import { useOpenCreateAgent } from '@/flows/agents/ui/open-create-agent';
import type { Agent, Project } from '@/types/electron';

export function AgentsListView() {
  const [agents, setAgents] = React.useState<Agent[]>([]);
  const [projectsById, setProjectsById] = React.useState<Record<string, Project>>({});
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState('');
  const { setOpen: setCreateOpen } = useOpenCreateAgent();

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([listAgents(), listProjects().catch(() => [])])
      .then(([agentList, projectList]) => {
        if (cancelled) return;
        setAgents(agentList);
        const map: Record<string, Project> = {};
        projectList.forEach((p) => { map[p.id] = p; });
        setProjectsById(map);
      })
      .catch(() => {
        if (!cancelled) setAgents([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = React.useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return agents;
    return agents.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.role?.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q),
    );
  }, [agents, filter]);

  const projectNameFor = (agent: Agent): string | undefined => {
    const firstId = agent.projectIds[0];
    if (!firstId) return undefined;
    return projectsById[firstId]?.name;
  };

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <header className="flex flex-col gap-1 px-8 pt-12 pb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Agents
            </h1>
            <p className="text-sm text-muted-foreground">
              {loading
                ? 'Loading agents…'
                : `${agents.length} ${agents.length === 1 ? 'agent' : 'agents'}`}
            </p>
          </div>
          <Button
            size="default"
            onClick={() => setCreateOpen(true)}
            className="gap-1.5"
          >
            <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
            New agent
          </Button>
        </div>

        {agents.length > 0 && (
          <div className="relative mt-2 max-w-md">
            <HugeiconsIcon
              icon={Search01Icon}
              className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search agents…"
              className="w-full rounded-md border border-input bg-input/20 py-1.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/40"
            />
          </div>
        )}
      </header>

      <ScrollArea className="flex-1">
        <div className="px-8 pb-12">
          {loading ? null : agents.length === 0 ? (
            <EmptyAgentsState />
          ) : filtered.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-1 text-center">
              <span className="text-sm text-muted-foreground">
                No agents match "{filter}"
              </span>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[260px">Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="w-[140px">Status</TableHead>
                    <TableHead className="w-[180px">Project</TableHead>
                    <TableHead className="w-[160px">Activity</TableHead>
                    <TableHead className="w-[100px] text-right">Updated</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((agent) => (
                    <AgentListRow
                      key={agent.id}
                      agent={agent}
                      projectName={projectNameFor(agent)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}