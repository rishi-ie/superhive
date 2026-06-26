/**
 * Defaults settings — startup view, default workspace, view mode, time format, kanban columns, right panel tab.
 */
import { useState } from 'react';
import { SettingSection } from './shared/SettingSection';
import { SettingRow } from './shared/SettingRow';
import { SettingsPageHeader } from './shared/SettingsPageHeader';
import { SaveBar } from '@/components/ui/SaveBar';
import { Select } from '@/components/ui/Select';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Pill } from '@/components/ui/Pill';
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
      <SettingsPageHeader
        title="Defaults"
        description="Configure what opens and how things display by default."
      />

      <SettingSection
        title="Startup"
        description="Controls what you see when Superhive launches."
      >
        <SettingRow
          label="Startup view"
          description="Which view or tab opens automatically when the app starts."
          control={
            <Select
              value={startupView}
              options={STARTUP_VIEWS}
              onChange={val => setStartupView(val as StartupView)}
              className="w-56"
            />
          }
        />
        <SettingRow
          label="Default workspace"
          description="Which workspace is pre-selected when the app opens."
          control={
            <Select
              value={defaultWorkspaceId}
              options={[{ value: '', label: 'Last opened' }, ...workspaces.map(ws => ({ value: ws.id, label: ws.name }))]}
              onChange={val => setDefaultWorkspaceId(val)}
              className="w-56"
            />
          }
        />
      </SettingSection>

      <SettingSection title="Display">
        <SettingRow
          label="View mode"
          description="Controls density of information in kanban and list views."
          control={
            <SegmentedControl
              options={VIEW_MODES}
              value={viewMode}
              onChange={val => setViewMode(val as ViewMode)}
            />
          }
        />
        <SettingRow
          label="Time format"
          description="How timestamps are displayed throughout the app."
          control={
            <Select
              value={timeFormat}
              options={TIME_FORMATS}
              onChange={val => setTimeFormat(val as TimeFormat)}
              className="w-56"
            />
          }
        />
        <SettingRow
          label="Right panel default tab"
          description="Which tab is shown in the right auxiliary panel when it opens."
          control={
            <Select
              value={rightPanelTab}
              options={RIGHT_PANEL_TABS}
              onChange={val => setRightPanelTab(val as RightPanelTab)}
              className="w-40"
            />
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
                  <Pill
                    key={col.value}
                    active={active}
                    onClick={() => toggleColumn(col.value)}
                  >
                    {col.label}
                  </Pill>
                );
              })}
            </div>
          }
        />
      </SettingSection>

      <SaveBar isDirty={isDirty} onCancel={discardChanges} onSave={save} variant="sticky" />
    </div>
  );
}
