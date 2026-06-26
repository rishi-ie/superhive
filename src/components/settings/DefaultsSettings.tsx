/**
 * Defaults settings — startup view, default workspace, view mode, time format, kanban columns, right panel tab.
 */
import { useState } from 'react';
import { SettingSection } from './shared/SettingSection';
import { SettingRow } from './shared/SettingRow';
import { Button } from '@/components/ui/Button';
import { useSettings } from '@/lib/settings-context';
import { useToast } from '@/lib/toast-context';
import type { StartupView, ViewMode, TimeFormat, KanbanColumn, RightPanelTab } from '@/data/settings/interface';
import { listWorkspaces } from '@/data/workspaces/store';

const STARTUP_VIEWS: { value: StartupView; label: string }[] = [
  { value: 'last', label: 'Last-opened view' },
  { value: 'universal-agents', label: 'Universal Agents' },
  { value: 'universal-channels', label: 'Universal Channels' },
  { value: 'universal-projects', label: 'Universal Projects' },
  { value: 'tickets', label: 'Tickets' },
  { value: 'swarm-roster', label: 'Swarm Roster' },
];

const VIEW_MODES: { value: ViewMode; label: string }[] = [
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'compact', label: 'Compact' },
];

const TIME_FORMATS: { value: TimeFormat; label: string }[] = [
  { value: 'relative', label: 'Relative (2 hours ago)' },
  { value: '12h', label: '12-hour (2:30 PM)' },
  { value: '24h', label: '24-hour (14:30)' },
];

const KANBAN_COLUMNS: { value: KanbanColumn; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'executing', label: 'Executing' },
  { value: 'review', label: 'Review' },
  { value: 'merged', label: 'Merged' },
];

const RIGHT_PANEL_TABS: { value: RightPanelTab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'manage', label: 'Manage' },
  { value: 'inbox', label: 'Inbox' },
  { value: 'sessions', label: 'Sessions' },
];

const selectClass =
  'rounded-md border border-border bg-input px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring';

/**
 * Defaults settings page — configure app startup and display defaults.
 */
export function DefaultsSettings() {
  const { settings, update } = useSettings();
  const toast = useToast();
  const workspaces = listWorkspaces();
  const d = settings.defaults;

  const [startupView, setStartupView] = useState(d.startupView);
  const [defaultWorkspaceId, setDefaultWorkspaceId] = useState(d.defaultWorkspaceId ?? '');
  const [viewMode, setViewMode] = useState(d.viewMode);
  const [timeFormat, setTimeFormat] = useState(d.timeFormat);
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>(d.defaultKanbanColumns);
  const [rightPanelTab, setRightPanelTab] = useState(d.rightPanelDefaultTab);

  const toggleColumn = (col: KanbanColumn) => {
    setKanbanColumns(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  const save = () => {
    update('defaults', {
      startupView,
      defaultWorkspaceId: defaultWorkspaceId || null,
      viewMode,
      timeFormat,
      defaultKanbanColumns: kanbanColumns,
      rightPanelDefaultTab: rightPanelTab,
    });
    toast({ title: 'Defaults saved' });
  };

  const discardChanges = () => {
    setStartupView(d.startupView);
    setDefaultWorkspaceId(d.defaultWorkspaceId ?? '');
    setViewMode(d.viewMode);
    setTimeFormat(d.timeFormat);
    setKanbanColumns(d.defaultKanbanColumns);
    setRightPanelTab(d.rightPanelDefaultTab);
  };

  const isDirty =
    startupView !== d.startupView ||
    defaultWorkspaceId !== (d.defaultWorkspaceId ?? '') ||
    viewMode !== d.viewMode ||
    timeFormat !== d.timeFormat ||
    JSON.stringify([...kanbanColumns].sort()) !== JSON.stringify([...d.defaultKanbanColumns].sort()) ||
    rightPanelTab !== d.rightPanelDefaultTab;

  return (
    <div className="flex flex-col">
      <div className="pb-8">
        <h2 className="text-2xl font-semibold text-foreground">Defaults</h2>
        <p className="mt-2 text-sm text-muted-foreground">Configure what opens and how things display by default.</p>
      </div>

      <SettingSection
        title="Startup"
        description="Controls what you see when Superhive launches."
      >
        <SettingRow
          label="Startup view"
          description="Which view or tab opens automatically when the app starts."
          control={
            <select
              value={startupView}
              onChange={e => setStartupView(e.target.value as StartupView)}
              className={`${selectClass} w-56`}
            >
              {STARTUP_VIEWS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          }
        />
        <SettingRow
          label="Default workspace"
          description="Which workspace is pre-selected when the app opens."
          control={
            <select
              value={defaultWorkspaceId}
              onChange={e => setDefaultWorkspaceId(e.target.value)}
              className={`${selectClass} w-56`}
            >
              <option value="">Last opened</option>
              {workspaces.map(ws => (
                <option key={ws.id} value={ws.id}>{ws.name}</option>
              ))}
            </select>
          }
        />
      </SettingSection>

      <SettingSection title="Display">
        <SettingRow
          label="View mode"
          description="Controls density of information in kanban and list views."
          control={
            <div className="flex rounded-md border border-border overflow-hidden">
              {VIEW_MODES.map((m, i) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setViewMode(m.value)}
                  aria-pressed={viewMode === m.value}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                    i > 0 ? 'border-l border-border' : ''
                  } ${
                    viewMode === m.value
                      ? 'bg-chart-1/20 text-chart-1'
                      : 'bg-card text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/30'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          }
        />
        <SettingRow
          label="Time format"
          description="How timestamps are displayed throughout the app."
          control={
            <select
              value={timeFormat}
              onChange={e => setTimeFormat(e.target.value as TimeFormat)}
              className={`${selectClass} w-56`}
            >
              {TIME_FORMATS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          }
        />
        <SettingRow
          label="Right panel default tab"
          description="Which tab is shown in the right auxiliary panel when it opens."
          control={
            <select
              value={rightPanelTab}
              onChange={e => setRightPanelTab(e.target.value as RightPanelTab)}
              className={`${selectClass} w-40`}
            >
              {RIGHT_PANEL_TABS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          }
        />
      </SettingSection>

      <SettingSection
        title="Kanban Columns"
        description="Which columns are visible in tickets and project kanban boards."
      >
        <SettingRow
          label="Visible columns"
          description="Toggle to show or hide columns in kanban boards. At least one column must be visible."
          control={
            <div className="flex flex-wrap gap-1.5">
              {KANBAN_COLUMNS.map(col => {
                const active = kanbanColumns.includes(col.value);
                return (
                  <button
                    key={col.value}
                    type="button"
                    onClick={() => toggleColumn(col.value)}
                    aria-pressed={active}
                    className={`text-xs font-medium px-3 py-1.5 rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                      active
                        ? 'bg-chart-1/15 border-chart-1/40 text-chart-1'
                        : 'border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/40'
                    }`}
                  >
                    {col.label}
                  </button>
                );
              })}
            </div>
          }
        />
      </SettingSection>

      {isDirty && (
        <div className="sticky bottom-0 mt-8 -mx-4 px-4 py-3 bg-sidebar/95 backdrop-blur border-t border-border flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">Unsaved changes</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={discardChanges}>
              Discard
            </Button>
            <Button variant="solid" size="sm" onClick={save}>
              Save changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
