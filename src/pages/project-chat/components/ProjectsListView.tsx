import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from "@/components/ui/icon";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  XIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { ProjectListRow } from './ProjectListRow';
import { EmptyProjectsState } from './EmptyProjectsState';
import { DeleteProjectDialog } from './DeleteProjectDialog';
import { listProjects } from '@/flows/projects/crud/list-projects';
import { deleteProject } from '@/flows/projects/crud/delete-project';
import { useOpenCreateProject } from '@/flows/projects/ui/open-create-project';
import { goToProject } from '@/flows/navigation';
import type { Project } from '@/types/electron';

const EXIT_ANIMATION_MS = 250;

export function ProjectsListView() {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState('');
  const [dialog, setDialog] = React.useState<{ kind: 'closed' } | { kind: 'delete'; projectId: string; projectName: string }>({ kind: 'closed' });
  const [visibleDialog, setVisibleDialog] = React.useState<{ kind: 'closed' } | { kind: 'delete'; projectId: string; projectName: string }>({ kind: 'closed' });
  const { setOpen: setCreateOpen } = useOpenCreateProject();
  const navigate = useNavigate();

  const reload = React.useCallback(async () => {
    return listProjects().catch(() => [] as Project[]);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    reload()
      .then((list) => { if (!cancelled) setProjects(list); })
      .catch(() => { if (!cancelled) setProjects([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reload]);

  React.useEffect(() => {
    if (dialog.kind !== 'closed') {
      setVisibleDialog(dialog);
    } else {
      const t = setTimeout(() => setVisibleDialog({ kind: 'closed' }), EXIT_ANIMATION_MS);
      return () => clearTimeout(t);
    }
  }, [dialog]);

  const filtered = React.useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(q));
  }, [projects, filter]);

  const dialogProject =
    visibleDialog.kind === 'delete'
      ? projects.find((p) => p.id === visibleDialog.projectId) ?? null
      : null;

  const handleRowClick = React.useCallback(
    (e: React.MouseEvent<HTMLTableSectionElement>) => {
      const target = e.target as HTMLElement
      const row = target.closest<HTMLElement>('[data-project-row]')
      const id = row?.dataset.projectRow
      if (!id) return
      goToProject(navigate, id)
    },
    [navigate],
  )

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <header className="flex flex-col gap-gap-tight px-8 pt-12 pb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-gap-tight">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Projects
            </h1>
            <p className="text-sm text-muted-foreground">
              {loading
                ? 'Loading projects…'
                : `${projects.length} ${projects.length === 1 ? 'project' : 'projects'}`}
            </p>
          </div>
          <Button
            size="default"
            onClick={() => setCreateOpen(true)}
            className="gap-list-item"
          >
            <Icon icon={PlusIcon} className="size-4" />
            New project
          </Button>
        </div>

        {projects.length > 0 ? (
          <div className="relative mt-2 max-w-md">
            <Icon
              icon={MagnifyingGlassIcon}
              className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search projects…"
              className="w-full rounded-button border border-input bg-input/20 py-1.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/40"
            />
            {filter ? (
              <button
                type="button"
                onClick={() => setFilter('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
              >
                <Icon icon={XIcon} className="size-3" />
              </button>
            ) : null}
          </div>
        ) : null}
      </header>

      <ScrollArea className="flex-1">
        <div className="px-8 pb-12">
          {loading ? null : projects.length === 0 ? (
            <EmptyProjectsState />
          ) : filtered.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-gap-tight text-center">
              <span className="text-sm text-muted-foreground">
                No projects match "{filter}"
              </span>
            </div>
          ) : (
            <div className="rounded-card border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[260px]">Name</TableHead>
                    <TableHead>Agents</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody onClick={handleRowClick}>
                  {filtered.map((project) => (
                    <ProjectListRow
                      key={project.id}
                      project={project}
                      onRowNavigate={(id) => goToProject(navigate, id)}
                      onOpenDelete={(projectId) => {
                        const target = projects.find((p) => p.id === projectId);
                        if (!target) return;
                        setDialog({
                          kind: 'delete',
                          projectId,
                          projectName: target.name,
                        });
                      }}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </ScrollArea>

      {visibleDialog.kind === 'delete' && dialogProject ? (
        <DeleteProjectDialog
          open={dialog.kind === 'delete'}
          projectName={dialogProject.name}
          onCancel={() => setDialog({ kind: 'closed' })}
          onConfirm={async () => {
            const targetId = visibleDialog.projectId;
            const result = await deleteProject(targetId);
            setDialog({ kind: 'closed' });
            if (result.ok) {
              setProjects((prev) => prev.filter((p) => p.id !== targetId));
            }
          }}
        />
      ) : null}
    </div>
  );
}
