/**
 * Defaults settings — startup view, view mode, time format,
 * kanban columns, and right-panel default tab.
 * Auto-saves each change with a toast confirmation. No Save bar.
 */
import { useCallback } from 'react';
import {
  History, Bot, MessageSquare, Layers, Ticket, Hexagon,
  Eye, Settings, Inbox, Clock, ArrowUp, ArrowDown,
} from 'lucide-react';
import { useSettings } from '@/lib/settings-context';
import { useToast } from '@/lib/toast-context';
import { Card, CardContent } from '@/components/ui/Card';
import { SelectableCard } from './shared/SelectableCard';
import { SettingsPageHeader } from './shared/SettingsPageHeader';
import { ResetSection } from './shared/ResetSection';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Pill } from '@/components/ui/Pill';
import { IconButton } from '@/components/ui/IconButton';
import { STROKE_WIDTH } from '@/lib/constants';
import type {
  StartupView,
  ViewMode,
  TimeFormat,
  KanbanColumn,
  RightPanelTab,
} from '@/data/settings/interface';

const STARTUP_OPTIONS: {
  value: StartupView;
  label: string;
  description: string;
  icon: typeof History;
}[] = [
  { value: 'last',               label: 'Last opened',         description: 'Resume the view you last had open.', icon: History },
  { value: 'universal-agents',   label: 'Universal Agents',    description: 'All agents across every workspace.', icon: Bot },
  { value: 'universal-channels', label: 'Universal Channels',  description: 'All channels across the workspace.', icon: MessageSquare },
  { value: 'universal-projects', label: 'Universal Projects',  description: 'All projects across the workspace.', icon: Layers },
  { value: 'tickets',            label: 'Tickets',             description: 'Jump straight into the tickets board.', icon: Ticket },
  { value: 'swarm-roster',       label: 'Swarm Roster',        description: 'Open the agent swarm overview (within Projects).', icon: Hexagon },
];

const VIEW_MODE_OPTIONS = [
  { value: 'comfortable' as ViewMode, label: 'Comfortable' },
  { value: 'compact'      as ViewMode, label: 'Compact' },
];

const TIME_FORMAT_OPTIONS: {
  value: TimeFormat;
  label: string;
  sample: string;
}[] = [
  { value: 'relative', label: 'Relative',  sample: '2h ago'  },
  { value: '12h',      label: '12-hour',   sample: '2:30 PM' },
  { value: '24h',      label: '24-hour',    sample: '14:30'   },
];

const KANBAN_COLUMNS: { value: KanbanColumn; label: string }[] = [
  { value: 'todo',      label: 'To Do'     },
  { value: 'executing', label: 'Executing' },
  { value: 'review',    label: 'Review'    },
  { value: 'merged',    label: 'Merged'    },
];

const RIGHT_PANEL_TABS: {
  value: RightPanelTab;
  label: string;
  icon: typeof Eye;
}[] = [
  { value: 'overview', label: 'Overview', icon: Eye     },
  { value: 'manage',   label: 'Manage',   icon: Settings },
  { value: 'inbox',    label: 'Inbox',    icon: Inbox  },
  { value: 'sessions', label: 'Sessions', icon: Clock  },
];

/**
 * Defaults settings — configure app startup and display defaults.
 * All changes auto-save immediately with a toast confirmation.
 */
export function DefaultsSettings() {
  const { settings, update } = useSettings();
  const toast = useToast();
  const d = settings.defaults;

  type DefaultsPatch = Partial<{
    startupView: StartupView;
    viewMode: ViewMode;
    timeFormat: TimeFormat;
    defaultKanbanColumns: KanbanColumn[];
    rightPanelDefaultTab: RightPanelTab;
  }>;

  const apply = useCallback((patch: DefaultsPatch) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (update as (domain: 'defaults', patch: DefaultsPatch) => void)('defaults', patch);
    toast({ title: 'Defaults updated', type: 'success' });
  }, [update, toast]);

  const setStartupView = (v: StartupView) => apply({ startupView: v });
  const setViewMode = (v: ViewMode) => apply({ viewMode: v });
  const setTimeFormat = (v: TimeFormat) => apply({ timeFormat: v });
  const setRightPanelTab = (v: RightPanelTab) => apply({ rightPanelDefaultTab: v });

  const toggleColumn = (col: KanbanColumn) => {
    const next = d.defaultKanbanColumns.includes(col)
      ? d.defaultKanbanColumns.filter(c => c !== col)
      : [...d.defaultKanbanColumns, col];
    apply({ defaultKanbanColumns: next });
  };

  const moveColumn = (idx: number, dir: -1 | 1) => {
    const cols = [...d.defaultKanbanColumns];
    const target = idx + dir;
    if (target < 0 || target >= cols.length) return;
    const a = cols[idx] as KanbanColumn;
    const b = cols[target] as KanbanColumn;
    cols[idx] = b;
    cols[target] = a;
    apply({ defaultKanbanColumns: cols });
  };

  return (
    <div className="flex flex-col gap-6">
      <SettingsPageHeader
        title="Defaults"
        description="Choose what opens when Superhive launches and how your workspace looks."
      />

      {/* ─── Startup View ───────────────────────────────────────────── */}
      <Card className="bg-card border border-border/40">
        <CardContent className="p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Startup view</h3>
            <p className="text-xs text-muted-foreground mt-1">
              The view or tab that opens automatically when Superhive launches.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {STARTUP_OPTIONS.map(opt => {
              const Icon = opt.icon;
              return (
                <SelectableCard
                  key={opt.value}
                  title={opt.label}
                  description={opt.description}
                  icon={<Icon size={16} strokeWidth={STROKE_WIDTH} />}
                  selected={d.startupView === opt.value}
                  onClick={() => setStartupView(opt.value)}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ─── Display ────────────────────────────────────────────────── */}
      <Card className="bg-card border border-border/40">
        <CardContent className="p-5 flex flex-col gap-6">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Display</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Controls density and how timestamps and panels look throughout the app.
            </p>
          </div>

          {/* View Mode */}
          <div className="flex items-start justify-between gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-foreground">View mode</span>
              <span className="text-[11px] text-muted-foreground">
                Adjusts spacing across kanban and list views.
              </span>
            </div>
            <SegmentedControl
              options={VIEW_MODE_OPTIONS}
              value={d.viewMode}
              onChange={v => setViewMode(v as ViewMode)}
            />
          </div>

          {/* Time Format */}
          <div>
            <div className="mb-2 flex flex-col gap-1">
              <span className="text-xs font-medium text-foreground">Time format</span>
              <span className="text-[11px] text-muted-foreground">
                How timestamps appear throughout the app.
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {TIME_FORMAT_OPTIONS.map(opt => (
                <SelectableCard
                  key={opt.value}
                  title={opt.label}
                  description={opt.sample}
                  icon={<Clock size={16} strokeWidth={STROKE_WIDTH} />}
                  selected={d.timeFormat === opt.value}
                  onClick={() => setTimeFormat(opt.value)}
                />
              ))}
            </div>
          </div>

          {/* Right Panel Default Tab */}
          <div>
            <div className="mb-2 flex flex-col gap-1">
              <span className="text-xs font-medium text-foreground">Right panel default tab</span>
              <span className="text-[11px] text-muted-foreground">
                Which tab is shown in the Avionics panel when it opens.
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              {RIGHT_PANEL_TABS.map(opt => {
                const Icon = opt.icon;
                return (
                  <SelectableCard
                    key={opt.value}
                    title={opt.label}
                    icon={<Icon size={16} strokeWidth={STROKE_WIDTH} />}
                    selected={d.rightPanelDefaultTab === opt.value}
                    onClick={() => setRightPanelTab(opt.value)}
                  />
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Kanban Columns ─────────────────────────────────────────── */}
      <Card className="bg-card border border-border/40">
        <CardContent className="p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Kanban columns</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Which columns appear in tickets and project kanban boards, and in what order.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {KANBAN_COLUMNS.map(col => {
                const idx = d.defaultKanbanColumns.indexOf(col.value);
                const active = idx >= 0;
                return (
                  <div key={col.value} className="flex items-center gap-0.5">
                    <Pill active={active} onClick={() => toggleColumn(col.value)}>
                      {col.label}
                    </Pill>
                    {active && (
                      <>
                        <IconButton
                          aria-label={`Move ${col.label} up`}
                          size="xs"
                          variant="ghost"
                          onClick={() => moveColumn(idx, -1)}
                          disabled={idx === 0}
                          className="size-5"
                        >
                          <ArrowUp size={10} strokeWidth={STROKE_WIDTH} />
                        </IconButton>
                        <IconButton
                          aria-label={`Move ${col.label} down`}
                          size="xs"
                          variant="ghost"
                          onClick={() => moveColumn(idx, 1)}
                          disabled={idx === d.defaultKanbanColumns.length - 1}
                          className="size-5"
                        >
                          <ArrowDown size={10} strokeWidth={STROKE_WIDTH} />
                        </IconButton>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[10.5px] text-muted-foreground tabular-nums">
              Active order: {d.defaultKanbanColumns.length
                ? d.defaultKanbanColumns.join(' → ')
                : 'none — select at least one column'}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <ResetSection domain="defaults" />
      </div>
    </div>
  );
}
