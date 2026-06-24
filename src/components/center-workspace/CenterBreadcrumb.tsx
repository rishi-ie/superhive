import { ChevronRight } from 'lucide-react';
import { MaximizeOnDoubleClick } from '@/components/ui/MaximizeOnDoubleClick';
import { Avatar } from '@/components/ui/Avatar';
import type { CenterTab } from '@/data/tabs/interface';

type CenterBreadcrumbProps = {
  tab: CenterTab;
  workspaceName: string;
  onJump?: (workspaceId: string, section?: string) => void;
};

type TabSegment = { label: string; onClick?: () => void; isLast: boolean };

function getBreadcrumbSegments(tab: CenterTab, workspaceName: string): TabSegment[] {
  const segments: TabSegment[] = [];

  segments.push({
    label: workspaceName,
    onClick: undefined,
    isLast: false,
  });

  const sectionLabel: Record<CenterTab['type'], string | null> = {
    projects: 'Projects',
    project: 'Project',
    tickets: 'Tickets',
    ticket: 'Tickets',
    channels: 'Comms',
    channel: 'Comms',
    agents: 'Agents',
    agent: 'Agents',
    'universal-agents': 'Agents',
    'universal-projects': 'Projects',
    settings: 'Settings',
  };

  const section = sectionLabel[tab.type];
  if (!section) return segments;

  const isUniversal = tab.type === 'universal-agents' || tab.type === 'universal-projects';

  segments.push({
    label: section,
    onClick: undefined,
    isLast: false,
  });

  if (tab.subtitle) {
    segments.push({
      label: tab.subtitle,
      onClick: undefined,
      isLast: true,
    });
  }

  const lastIndex = segments.length - 1;
  for (let i = 0; i < segments.length; i++) {
    segments[i] = { ...segments[i]!, isLast: i === lastIndex };
  }

  return segments;
}

export function CenterBreadcrumb({ tab, workspaceName, onJump }: CenterBreadcrumbProps) {
  const segments = getBreadcrumbSegments(tab, workspaceName);

  return (
    <MaximizeOnDoubleClick className="flex items-center h-9 border-b border-border px-4">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
        {segments.map((seg, i) => {
          const isLast = i === segments.length - 1;
          return (
            <span key={i} className="flex items-center gap-1.5 min-w-0">
              {i === 0 ? (
                <span className="flex items-center gap-1.5 min-w-0">
                  <Avatar
                    size="xs"
                    fallback={workspaceName.slice(0, 2).toUpperCase()}
                    className="shrink-0"
                  />
                  <button
                    onClick={seg.onClick}
                    className={`truncate max-w-[160px] ${seg.isLast ? 'text-foreground font-medium' : 'hover:text-foreground cursor-pointer'} transition-colors`}
                    disabled={!seg.onClick}
                  >
                    {seg.label}
                  </button>
                </span>
              ) : (
                <button
                  onClick={seg.onClick}
                  className={`truncate max-w-[200px] ${seg.isLast ? 'text-foreground font-medium' : 'hover:text-foreground cursor-pointer'} transition-colors`}
                  disabled={!seg.onClick}
                >
                  {seg.label}
                </button>
              )}
              {!isLast && (
                <ChevronRight size={12} className="text-muted-foreground/60 shrink-0" />
              )}
            </span>
          );
        })}
      </div>
    </MaximizeOnDoubleClick>
  );
}
