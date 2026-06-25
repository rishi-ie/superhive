/**
 * All projects across workspaces with search, workspace filter, and sort.
 */
import { useMemo, useState } from 'react';
import { FolderOpen } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { SearchBar } from '@/components/ui/SearchBar';
import { StatusFilter, type FilterOption } from '@/components/ui/StatusFilter';
import { NewButton } from '@/components/ui/NewButton';
import { UniversalListCard } from '@/components/ui/UniversalListCard';
import { OnboardingWizard } from './OnboardingWizard';
import { PROJECTS_WIZARD_CONFIG } from '@/data/config/wizard-configs';
import { listProjects } from '@/data/projects/store';
import { listWorkspaces } from '@/data/workspaces/store';
import { formatRelativeTime } from '@/lib/relative-time';
import type { OnboardingWizardProps } from './OnboardingWizard';

type SortKey = 'name' | 'activity' | 'tickets';

const STATUS_OPTIONS = [
  { value: 'ALL' as const, label: 'All' },
  { value: 'vela' as const, label: 'Vela' },
  { value: 'widget' as const, label: 'Widget' },
  { value: 'admin' as const, label: 'Admin' },
  { value: 'mobile' as const, label: 'Mobile' },
] as const;

type WorkspaceFilter = 'ALL' | string;

type UniversalProjectsViewProps = {
  onProjectSelect?: (id: string, workspaceId: string) => void;
  selectedProjectId?: string | null;
  onAction?: OnboardingWizardProps['onAction'];
};

/**
 * @param onProjectSelect - Called when a project is selected
 * @param selectedProjectId - Currently selected project ID
 * @param onAction - Called when an onboarding action is taken
 */
export function UniversalProjectsView({ onProjectSelect, selectedProjectId, onAction }: UniversalProjectsViewProps) {
  const [query, setQuery] = useState('');
  const [workspaceFilter, setWorkspaceFilter] = useState<WorkspaceFilter>('ALL');
  const [sort, setSort] = useState<SortKey>('activity');

  const projects = listProjects();
  const workspaces = listWorkspaces();

  const workspaceMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const w of workspaces) m[w.id] = w.name;
    return m;
  }, [workspaces]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: projects.length };
    for (const p of projects) {
      counts[p.workspaceId] = (counts[p.workspaceId] ?? 0) + 1;
    }
    return counts;
  }, [projects]);

  const filterOptions = useMemo<readonly FilterOption<WorkspaceFilter>[]>(() =>
    STATUS_OPTIONS.map(o => ({
      ...o,
      count: statusCounts[o.value === 'ALL' ? 'ALL' : o.value] ?? 0,
    })),
    [statusCounts]
  );

  const filtered = useMemo(() => {
    let result = projects;
    if (workspaceFilter !== 'ALL') {
      result = result.filter(p => p.workspaceId === workspaceFilter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (workspaceMap[p.workspaceId] ?? '').toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) => {
      if (sort === 'name') return a.title.localeCompare(b.title);
      if (sort === 'activity') {
        const aTime = a.activity[0]?.timestamp ?? '';
        const bTime = b.activity[0]?.timestamp ?? '';
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      }
      if (sort === 'tickets') return b.tickets.length - a.tickets.length;
      return 0;
    });
  }, [projects, query, workspaceFilter, sort, workspaceMap]);

  if (projects.length === 0) {
    return (
      <OnboardingWizard config={PROJECTS_WIZARD_CONFIG} onAction={onAction} />
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 pt-5 pb-3 shrink-0">
        <h1 className="text-base font-bold text-foreground">All Projects</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {projects.length} project{projects.length !== 1 ? 's' : ''} across {Object.keys(statusCounts).length - 1} workspace{Object.keys(statusCounts).length - 1 !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="px-6 pb-3 flex items-center gap-3 shrink-0">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search projects..."
          className="flex-1"
        />
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
          className="rounded-md border border-border bg-input px-2 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
        >
          <option value="activity">Sort: Activity</option>
          <option value="name">Sort: Name</option>
          <option value="tickets">Sort: Tickets</option>
        </select>
        <NewButton label="New Project" onClick={() => onAction?.('create-project')} />
      </div>

      <div className="px-6 pb-3 shrink-0">
        <StatusFilter
          options={filterOptions}
          value={workspaceFilter}
          onChange={setWorkspaceFilter}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">No projects match &ldquo;{query}&rdquo;</p>
            <button
              type="button"
              onClick={() => { setQuery(''); setWorkspaceFilter('ALL'); }}
              className="mt-2 text-xs text-chart-1 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(project => {
              const lastActivity = project.activity[0];
              const openChannels = project.channels.filter(c => c.status !== 'RESOLVED').length;
              const backlog = project.tickets.filter(t => t.status === 'TODO').length;
              const executing = project.tickets.filter(t => t.status === 'EXECUTING').length;
              const done = project.tickets.filter(t => t.status === 'DONE').length;

              return (
                <UniversalListCard
                  key={project.id}
                  selected={selectedProjectId === project.id}
                  onClick={() => onProjectSelect?.(project.id, project.workspaceId)}
                  className="flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-2">
                    <FolderOpen
                      size={14}
                      strokeWidth={STROKE_WIDTH}
                      className="text-muted-foreground shrink-0"
                    />
                    <span className="text-xs font-semibold text-foreground truncate">{project.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0">·</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {workspaceMap[project.workspaceId] ?? project.workspaceId}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">·</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {project.agents.length} agent{project.agents.length !== 1 ? 's' : ''}
                    </span>
                    {lastActivity && (
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-auto">
                        {formatRelativeTime(lastActivity.timestamp)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground">
                      {backlog} backlog
                    </span>
                    {executing > 0 && (
                      <span className="text-[10px] text-chart-3">
                        · {executing} executing
                      </span>
                    )}
                    {done > 0 && (
                      <span className="text-[10px] text-chart-2">
                        · {done} done
                      </span>
                    )}
                    {openChannels > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        · {openChannels} open channel{openChannels !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {lastActivity && (
                    <p className="text-[10px] text-muted-foreground/70 truncate leading-3">
                      → {lastActivity.primaryAgent} {lastActivity.action.toLowerCase()} · {lastActivity.context}
                    </p>
                  )}
                </UniversalListCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
