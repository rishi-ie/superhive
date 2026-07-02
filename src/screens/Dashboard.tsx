/**
 * Three-panel workspace shell — LeftNav + CenterWorkspace + RightAuxiliary.
 * Orchestrates tab state, workspace selection, and cross-panel event routing.
 *
 * Owns the global keyboard shortcut listener (mounted via `useGlobalShortcuts`).
 * Single source of action callbacks — shortcut handlers read these via ShortcutAPI.
 */
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { LeftNav } from '@/components/left-nav/LeftNav';
import { CenterWorkspace } from '@/components/center-workspace/CenterWorkspace';
import { RightAuxiliary } from '@/components/right-auxiliary/RightAuxiliary';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { CreateProjectDialog } from '@/components/center-workspace/CreateProjectDialog';
import { CreateTicketDialog } from '@/components/center-workspace/CreateTicketDialog';
import { CreateChannelDialog } from '@/components/center-workspace/CreateChannelDialog';
import { PermissionToastContainer } from '@/components/ui/PermissionToastContainer';
import { SubAgentSpawnToastContainer } from '@/components/ui/SubAgentSpawnToast';
import { CommandPalette, buildDefaultPaletteItems } from '@/components/shortcuts';
import {
  useGlobalShortcuts,
  type ShortcutAPI,
} from '@/lib/shortcuts';
import { DEFAULT_LEFT_WIDTH, DEFAULT_RIGHT_WIDTH } from '@/lib/constants';
import type { Page } from '@/App';
import type { ActiveAgent } from '@/components/left-nav/ActiveSection';
import type { ArchivedProjectSummary } from '@/components/left-nav/ArchivedProjectsSection';
import { listWorkspaces } from '@/data/workspaces/store';
import { getProject, getProjectByWorkspace, listProjectAgents, listProjects } from '@/data/projects/store';
import { listUniversalTickets } from '@/data/tickets/store';
import { listFavorites } from '@/data/favorites/store';
import { listAgents, getAgentWorkspace } from '@/data/agents/store';
import { terminateAgentProcess } from '@/data/agent_processes/store';
import { addMessageToActiveThread, getThread } from '@/data/chat/store';
import {
  makeInitialTabState,
  openOrFocusTab as openTabOp,
  closeTab as closeTabOp,
  selectTab as selectTabOp,
  getActiveTab,
  findTab,
  pinTab as pinTabOp,
} from '@/data/tabs/store';
import type { CenterTabType, CenterTab } from '@/data/tabs/interface';
import type { Workspace } from '@/data/workspaces/interface';
import type { FavoriteItem } from '@/data/favorites/interface';
import {
  getRightPanelTabs,
  getDefaultRightPanelTab,
  type RightPanelContext,
  type RightPanelTabId,
} from '@/data/config/right-panel-tabs';
import { useSettings } from '@/lib/settings-context';
import { useToast } from '@/lib/toast-context';

type DashboardProps = {
  page: Page;
  leftWidth: number;
  rightWidth: number;
  onLeftWidthChange: (width: number) => void;
  onRightWidthChange: (width: number) => void;
  onNavigate: (page: Page) => void;
};

function toActiveAgent(agents: ReturnType<typeof listAgents>): ActiveAgent[] {
  return agents.map((a) => ({
    id: a.id,
    name: a.name,
    status: a.status === 'EXECUTING' || a.status === 'COMPILING' || a.status === 'AWAITING_HUMAN'
      ? 'active'
      : a.status === 'IDLE'
      ? 'idle'
      : 'busy',
    currentTask: a.activeTask,
  }));
}

function buildTab(
  type: CenterTabType,
  workspaceId: string,
  title: string,
  extra: Partial<Pick<CenterTab, 'selectedAgentId' | 'selectedProjectId' | 'selectedTicketId' | 'selectedChannelId' | 'subtitle'>> = {},
) {
  return { type, workspaceId, title, subtitle: extra.subtitle, pinned: false, modified: false,
    selectedAgentId: extra.selectedAgentId ?? null,
    selectedProjectId: extra.selectedProjectId ?? null,
    selectedTicketId: extra.selectedTicketId ?? null,
    selectedChannelId: extra.selectedChannelId ?? null,
  };
}

/**
 * Three-panel workspace shell — LeftNav + CenterWorkspace + RightAuxiliary.
 * @param page - The current top-level page (used to gate shortcut scoping)
 * @param leftWidth - Current width of the left navigation panel
 * @param rightWidth - Current width of the right auxiliary panel
 * @param onLeftWidthChange - Callback when left panel width changes
 * @param onRightWidthChange - Callback when right panel width changes
 * @param onNavigate - Callback when user navigates to a different page (e.g. settings)
 */
export function Dashboard({
  page,
  leftWidth,
  rightWidth,
  onLeftWidthChange,
  onRightWidthChange,
  onNavigate,
}: DashboardProps) {
  const [tabState, setTabState] = useState(() => {
    const firstWs = listWorkspaces()[0];
    return makeInitialTabState(firstWs?.id ?? '');
  });
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(() => listWorkspaces()[0]?.id ?? '');
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTabId>('overview');
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [projectsVersion, setProjectsVersion] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [pendingSettingsSection, setPendingSettingsSection] = useState<string | null>(null);
  const [newTabMenuIndex, setNewTabMenuIndex] = useState(0);
  const newTabMenuTrigger = useRef<(() => void) | null>(null);
  const { update: updateSettings } = useSettings();
  const toast = useToast();

  // Sync activeWorkspaceId when workspaces change (e.g., created from Settings)
  const workspaces_data = listWorkspaces().filter(w => !w.archivedAt);

  useEffect(() => {
    if (activeWorkspaceId === '' && workspaces_data.length > 0) {
      setActiveWorkspaceId(workspaces_data[0]!.id);
    } else if (activeWorkspaceId !== '' && !workspaces_data.find(w => w.id === activeWorkspaceId)) {
      setActiveWorkspaceId(workspaces_data[0]?.id ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaces_data.length]);

  const currentWorkspace = workspaces_data.find(w => w.id === activeWorkspaceId) ?? workspaces_data[0] ?? null;
  const favorites_data = listFavorites();
  const workspaceAgents = listProjectAgents(activeWorkspaceId);
  const workspaceAgentNames = new Set(workspaceAgents.map(a => a.name));
  const agents_data = toActiveAgent(
    listAgents().filter(a => workspaceAgentNames.has(a.name))
  );

  const workspaceMap = useMemo(
    () => Object.fromEntries(listWorkspaces().map(w => [w.id, w.name])),
    [],
  );

  const archivedProjects = useMemo<ArchivedProjectSummary[]>(
    () =>
      listProjects({ status: 'ARCHIVED' }).map(p => ({
        id: p.id,
        workspaceId: p.workspaceId,
        title: p.title,
        color: p.color,
      })),
    [projectsVersion],
  );

  const bumpProjectsVersion = useCallback(() => {
    setProjectsVersion(v => v + 1);
  }, []);

  const activeTab = getActiveTab(tabState);
  const activeWorkspaceIdRef = useRef(activeWorkspaceId);
  activeWorkspaceIdRef.current = activeWorkspaceId;

  const rightPanelContext = useMemo<RightPanelContext>(() => {
    if (!activeTab) return null;
    if (activeTab.type === 'agent' && activeTab.selectedAgentId) return { kind: 'agent', agentId: activeTab.selectedAgentId };
    if (activeTab.type === 'tickets' && activeTab.selectedTicketId) return { kind: 'ticket', ticketId: activeTab.selectedTicketId };
    if (activeTab.type === 'project' && activeTab.selectedProjectId) return { kind: 'project', projectId: activeTab.selectedProjectId, workspaceId: activeTab.workspaceId };
    if (activeTab.type === 'channel' && activeTab.selectedChannelId) return { kind: 'channel', channelId: activeTab.selectedChannelId, workspaceId: activeTab.workspaceId };
    if (activeTab.type === 'channels') return { kind: 'channels-list', workspaceId: activeTab.workspaceId };
    if (activeTab.type === 'agents') return { kind: 'agents-list', workspaceId: activeTab.workspaceId };
    if (activeTab.type === 'universal-agents') return { kind: 'universal-agents' };
    if (activeTab.type === 'universal-projects') return { kind: 'universal-projects' };
    if (activeTab.type === 'universal-channels') return { kind: 'universal-channels' };
    if (activeTab.type === 'home') return { kind: 'home', workspaceId: activeTab.workspaceId };
    if (activeTab.type === 'workspace-agent') return { kind: 'workspace-agent', workspaceId: activeTab.workspaceId };
    if (activeTab.type === 'project-agent') return { kind: 'project-agent', projectId: activeTab.selectedProjectId ?? '', workspaceId: activeTab.workspaceId };
    return null;
  }, [activeTab]);

  const rightPanelTabs = getRightPanelTabs(rightPanelContext);
  const defaultRightTab = getDefaultRightPanelTab(rightPanelContext);
  const currentRightPanelTab = rightPanelTabs.some(t => t.id === rightPanelTab) ? rightPanelTab : defaultRightTab;

  // ─── Tab operations ────────────────────────────────────────────────

  const openTab = useCallback((tab: Omit<CenterTab, 'id' | 'createdAt'>) => {
    setTabState(prev => openTabOp(prev, tab));
  }, []);

  // ─── Click handlers ───────────────────────────────────────────────

  const handleNavItemClick = useCallback((id: string) => {
    const ws = activeWorkspaceId;
    if (id === 'agents' || id === 'universal-agents') {
      openTab(buildTab('universal-agents', ws, 'Agents'));
    } else if (id === 'communications') {
      openTab(buildTab('channels', ws, 'Comms'));
    } else if (id === 'projects' || id === 'universal-projects') {
      openTab(buildTab('universal-projects', ws, 'Projects'));
    } else if (id === 'tickets') {
      openTab(buildTab('tickets', ws, 'Tickets'));
    } else if (id === 'meta-hive') {
      openTab(buildTab('universal-agents', ws, 'Agents'));
    } else if (id === 'remote') {
      toast({ title: 'Remote agents', description: 'Remote agent management coming soon.', type: 'info' });
    }
  }, [openTab, activeWorkspaceId, toast]);

  const handleWorkspaceSelect = useCallback((workspace: Workspace) => {
    setActiveWorkspaceId(workspace.id);
  }, []);

  const handleAgentSelect = useCallback((id: string) => {
    const ws = getAgentWorkspace(id) ?? activeWorkspaceId;
    const agent = listAgents().find(a => a.id === id);
    openTab(buildTab('agent', ws, agent?.name ?? 'Agent', { selectedAgentId: id }));
  }, [openTab, activeWorkspaceId]);

  const handleProjectSelect = useCallback((projectId: string, workspaceId: string) => {
    const project = getProject(projectId);
    openTab(buildTab('project', workspaceId, project?.title ?? 'Project', { selectedProjectId: projectId }));
  }, [openTab]);

  const handleTicketSelect = useCallback((ticketId: string) => {
    const ticket = listUniversalTickets().find(t => t.id === ticketId);
    const ws = ticket?.workspaceId ?? activeWorkspaceId;

    setTabState(prev => {
      const existing = findTab(prev, 'ticket', ws, ticketId);
      if (existing) {
        return selectTabOp(prev, existing.id);
      }
      return openTabOp(prev, buildTab('ticket', ws, ticket?.title ?? 'Ticket', { selectedTicketId: ticketId }));
    });
    setRightPanelTab('overview');
  }, [activeWorkspaceId]);

  const handleChannelSelect = useCallback((channelId: string, workspaceId: string) => {
    openTab(buildTab('channel', workspaceId, 'Channel', { selectedChannelId: channelId }));
  }, [openTab]);

  const handleFavoriteSelect = useCallback((item: FavoriteItem) => {
    if (item.type === 'agent') {
      handleAgentSelect(item.id);
    } else if (item.type === 'project') {
      const project = getProject(item.id);
      if (project) {
        handleProjectSelect(project.id, project.workspaceId);
      }
    }
  }, [handleAgentSelect, handleProjectSelect]);

  const handleTabClick = useCallback((tabId: string) => {
    setTabState(prev => selectTabOp(prev, tabId));
  }, []);

  const handleTabClickByIndex = useCallback((n: number) => {
    setTabState(prev => {
      const tab = prev.tabs[n - 1];
      if (tab) return selectTabOp(prev, tab.id);
      return prev;
    });
  }, []);

  const handleTabClose = useCallback((tabId: string) => {
    setTabState(prev => closeTabOp(prev, tabId));
  }, []);

  const closeOtherTabs = useCallback(() => {
    setTabState(prev => {
      const activeId = prev.activeTabId;
      let next = prev;
      // Close every tab except active and pinned
      const idsToClose = next.tabs
        .filter(t => t.id !== activeId && !t.pinned)
        .map(t => t.id);
      for (const id of idsToClose) {
        next = closeTabOp(next, id);
      }
      return next;
    });
  }, []);

  const openOrFocusTab = useCallback((tab: Omit<CenterTab, 'id' | 'createdAt'>) => {
    setTabState(prev => openTabOp(prev, tab));
  }, []);

  const handleBreadcrumbJump = useCallback((workspaceId: string, section?: string) => {
    if (section) {
      const SECTION_TAB: Record<string, CenterTabType> = {
        Projects: 'universal-projects',
        Tickets: 'tickets',
        Comms: 'channels',
        Agents: 'agents',
      };
      const type = SECTION_TAB[section];
      if (type) openTab(buildTab(type, workspaceId, section));
    } else {
      openTab(buildTab('universal-projects', workspaceId, 'Projects', {},));
    }
  }, [openTab]);

  const handleCreateProject = useCallback(() => {
    setCreateProjectOpen(true);
  }, []);

  const handleCreateTicket = useCallback(() => {
    setCreateTicketOpen(true);
  }, []);

  const handleCreateChannel = useCallback(() => {
    setCreateChannelOpen(true);
  }, []);

  const handleCreateAgent = useCallback(() => {
    toast({ title: 'Agent creation wizard', description: 'Coming soon (Phases 32-37 are manual).', type: 'info' });
  }, [toast]);

  const handleProjectCreated = useCallback((project: import('@/data/projects/interface').Project) => {
    bumpProjectsVersion();
    openTab(buildTab('project', project.workspaceId, project.title, { selectedProjectId: project.id }));
  }, [openTab, bumpProjectsVersion]);

  const handleTerminateAgent = useCallback((agentId: string) => {
    terminateAgentProcess(agentId);
    window.electron.agents.terminate(agentId).catch(() => {});
    toast({ title: 'Agent terminated', description: 'The agent process has been stopped.', type: 'success' });
  }, [toast]);

  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  const handleProjectSelectByWorkspace = useCallback((workspaceId: string) => {
    const project = getProjectByWorkspace(workspaceId);
    if (project) openTab(buildTab('project', workspaceId, project.title, { selectedProjectId: project.id }));
  }, [openTab]);

  const handleOpenTab = useCallback((kind: string) => {
    if (kind === 'tickets') {
      openTab(buildTab('tickets', activeWorkspaceId, 'Tickets'));
    } else if (kind === 'universal-channels') {
      openTab(buildTab('universal-channels', activeWorkspaceId, 'Channels'));
    } else if (kind === 'universal-agents') {
      openTab(buildTab('universal-agents', activeWorkspaceId, 'Agents'));
    }
  }, [openTab, activeWorkspaceId]);

  const handleChannelClick = handleChannelSelect;

  const handleThreadSelect = useCallback((threadId: string) => {
    const thread = getThread(threadId);
    if (!thread) return;
    const ws = thread.workspaceId ?? activeWorkspaceId;
    const agentId = thread.agentId;
    if (agentId) {
      openTab(buildTab('agent', ws, thread.title || 'Agent', { selectedAgentId: agentId }));
    }
  }, [openTab, activeWorkspaceId]);

  const handleSendMessage = useCallback((message: string) => {
    addMessageToActiveThread(message);
  }, []);

  const handleToggleLeftPanel = useCallback(() => {
    onLeftWidthChange(leftWidth === 0 ? DEFAULT_LEFT_WIDTH : 0);
  }, [leftWidth, onLeftWidthChange]);

  const handleToggleRightPanel = useCallback(() => {
    onRightWidthChange(rightWidth === 0 ? DEFAULT_RIGHT_WIDTH : 0);
  }, [rightWidth, onRightWidthChange]);

  const handleOpenTickets = useCallback(() => {
    openTab(buildTab('tickets', activeWorkspaceId, 'Tickets'));
  }, [openTab, activeWorkspaceId]);

  // ─── Pinned-tab shortcut ─────────────────────────────────────────
  const handleTogglePin = useCallback(() => {
    setTabState(prev => {
      if (!prev.activeTabId) return prev;
      const t = prev.tabs.find(x => x.id === prev.activeTabId);
      if (!t) return prev;
      return pinTabOp(prev, t.id, !t.pinned);
    });
  }, []);

  // ─── Theme toggle ────────────────────────────────────────────────
  const handleToggleTheme = useCallback(() => {
    const next = currentTheme === 'dark' ? 'light' : 'dark';
    updateSettings('appearance', { theme: next });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Search focus ────────────────────────────────────────────────
  const focusSearch = useCallback(() => {
    // Trigger any [data-search-input] element to focus
    const el = document.querySelector<HTMLElement>('[data-search-input]');
    if (el) (el as HTMLInputElement).focus();
    else toast({ title: 'No active search', type: 'info' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Send active chat msg / focus chat input (best-effort) ────────
  const sendActiveChatMessage = useCallback(() => {
    const editable = document.querySelector<HTMLElement>('[data-chat-input] textarea');
    if (!editable) {
      // Fallback: dispatch Enter on textarea
      const ta = document.querySelector<HTMLTextAreaElement>('textarea[data-chat-input-textarea], textarea[data-chat-send-target]');
      if (ta) {
        ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, shiftKey: false }));
      }
      return;
    }
    (editable as HTMLTextAreaElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, shiftKey: false }));
  }, []);

  const focusChatInput = useCallback(() => {
    const el = document.querySelector<HTMLElement>('[data-chat-input] textarea');
    if (el) (el as HTMLTextAreaElement).focus();
  }, []);

  // ─── Confirm active modal (best-effort: clicks a [data-modal-default-action]) ────
  const confirmActiveModal = useCallback(() => {
    const btn = document.querySelector<HTMLButtonElement>('[data-modal-default-action], dialog[open] button[type="submit"]');
    if (btn) btn.click();
  }, []);

  // ─── Open new-tab menu: trigger the + IconButton in CenterTabStrip ────
  const openNewTabMenu = useCallback(() => {
    // Fall back to opening the home tab if we can't find the + button
    const plusBtn = document.querySelector<HTMLButtonElement>('[data-new-tab-button]');
    if (plusBtn) plusBtn.click();
    else openTab(buildTab('home', activeWorkspaceId, 'Home'));
  }, [openTab, activeWorkspaceId]);

  // ─── Pending settings section handling ────────────────────────────────
  const requestOpenSection = useCallback((id: string) => {
    setPendingSettingsSection(id);
  }, []);

  useEffect(() => {
    if (page === 'settings' && pendingSettingsSection) {
      // Dispatch a custom event that Settings.tsx can listen to
      window.dispatchEvent(new CustomEvent('settings:open-section', { detail: { id: pendingSettingsSection } }));
      setPendingSettingsSection(null);
    }
  }, [page, pendingSettingsSection]);

  // ─── Listen for help-popover shortcut item → open palette ─────────────
  useEffect(() => {
    function onHelpShortcut() {
      setPaletteOpen(true);
    }
    window.addEventListener('app:open-command-palette', onHelpShortcut);
    return () => window.removeEventListener('app:open-command-palette', onHelpShortcut);
  }, []);

  // ─── Theme observation for toggleTheme callback closure ─────────────
  const { settings } = useSettings();
  const currentTheme = settings.appearance.theme;

  // ─── Build the ShortcutAPI for useGlobalShortcuts ────────────────────
  const shortcutApi = useMemo<ShortcutAPI>(() => ({
    navigate: onNavigate,
    isOnSettingsPage: page === 'settings',
    toggleLeftPanel: handleToggleLeftPanel,
    toggleRightPanel: handleToggleRightPanel,
    focusSearch,
    openPalette: () => setPaletteOpen(true),
    closePalette: () => setPaletteOpen(false),
    isPaletteOpen: paletteOpen,
    requestOpenSection,
    toggleTheme: handleToggleTheme,

    activeWorkspaceId,
    tabs: tabState.tabs,
    activeTab,
    activeTabId: tabState.activeTabId,
    handleTabClick,
    handleTabClickByIndex,
    handleTabClose,
    closeOtherTabs,
    openOrFocusTab,
    openNewTabMenu,
    togglePin: handleTogglePin,

    setRightPanelTab,

    openProjectDialog: () => setCreateProjectOpen(true),
    openTicketDialog: () => setCreateTicketOpen(true),
    openChannelDialog: () => setCreateChannelOpen(true),

    sendActiveChatMessage,
    focusChatInput,

    confirmActiveModal,
  }), [
    page, onNavigate, handleToggleLeftPanel, handleToggleRightPanel, focusSearch,
    paletteOpen, requestOpenSection, handleToggleTheme,
    activeWorkspaceId, tabState.tabs, activeTab, tabState.activeTabId,
    handleTabClick, handleTabClickByIndex, handleTabClose, closeOtherTabs,
    openOrFocusTab, openNewTabMenu, handleTogglePin, setRightPanelTab,
    sendActiveChatMessage, focusChatInput, confirmActiveModal,
  ]);

  // Suppress unused warning — captured for potential future use
  void newTabMenuIndex;
  void setNewTabMenuIndex;
  void newTabMenuTrigger;
  void updateSettings;

  // ─── Global keyboard shortcut manager ────────────────────────────────
  useGlobalShortcuts(shortcutApi);

  // ─── Setup wizard dismissal state (session-persisted) ─────────────────
  const [setupDismissed, setSetupDismissed] = useState<boolean>(() =>
    sessionStorage.getItem('wizard:setup:dismissed') === '1',
  );
  const [readyDismissedByWs, setReadyDismissedByWs] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(sessionStorage.getItem('wizard:ready:dismissed') ?? '{}');
    } catch {
      return {};
    }
  });

  const readyDismissed = !!readyDismissedByWs[activeWorkspaceId];

  const dismissSetup = useCallback(() => {
    setSetupDismissed(true);
    sessionStorage.setItem('wizard:setup:dismissed', '1');
  }, []);

  const dismissReady = useCallback(() => {
    setReadyDismissedByWs(prev => {
      const next = { ...prev, [activeWorkspaceId]: true };
      sessionStorage.setItem('wizard:ready:dismissed', JSON.stringify(next));
      return next;
    });
  }, [activeWorkspaceId]);

  const handleWorkspaceCreated = useCallback((id: string) => {
    setActiveWorkspaceId(id);
    dismissSetup();
  }, [dismissSetup]);

  const handleReopenSetup = useCallback(() => {
    setSetupDismissed(false);
    sessionStorage.removeItem('wizard:setup:dismissed');
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <PermissionToastContainer />
      <SubAgentSpawnToastContainer />
      <LeftNav
        width={leftWidth}
        onWidthChange={onLeftWidthChange}
        workspaces={workspaces_data}
        currentWorkspace={currentWorkspace}
        favorites={favorites_data}
        activeAgents={agents_data}
        archivedProjects={archivedProjects}
        onWorkspaceSelect={handleWorkspaceSelect}
        onSettingsClick={() => onNavigate('settings')}
        onFavoritesItemClick={handleFavoriteSelect}
        onActiveAgentClick={handleAgentSelect}
        onNavItemClick={handleNavItemClick}
        currentView={activeTab?.type ?? 'projects'}
        onAgentSelect={handleAgentSelect}
        onProjectClick={handleProjectSelect}
        onToggleLeftPanel={handleToggleLeftPanel}
        onToggleRightPanel={handleToggleRightPanel}
        onSetupWizard={handleReopenSetup}
      />
      <CenterWorkspace
        tabs={tabState.tabs}
        activeTabId={tabState.activeTabId}
        workspaceMap={workspaceMap}
        onTabClick={handleTabClick}
        onTabClose={handleTabClose}
        onBreadcrumbJump={handleBreadcrumbJump}
        onTicketSelect={handleTicketSelect}
        onAgentSelect={handleAgentSelect}
        onProjectSelect={handleProjectSelect}
        onChannelSelect={handleChannelSelect}
        onNavItemClick={handleNavItemClick}
        onSend={handleSendMessage}
        onOpenTickets={handleOpenTickets}
        onCreateProject={handleCreateProject}
        onCreateTicket={handleCreateTicket}
        onCreateChannel={handleCreateChannel}
        onCreateAgent={handleCreateAgent}
        setupDismissed={setupDismissed}
        readyDismissed={readyDismissed}
        onWorkspaceCreated={handleWorkspaceCreated}
        onDismissSetup={dismissSetup}
        onDismissReady={dismissReady}
        onOpenSettings={() => onNavigate('settings')}
      />
      <ErrorBoundary>
        <RightAuxiliary
          width={rightWidth}
          onWidthChange={onRightWidthChange}
          context={rightPanelContext}
          tab={currentRightPanelTab}
          onTabChange={setRightPanelTab}
          onRefresh={handleRefresh}
          onTerminate={handleTerminateAgent}
          onAgentClick={handleAgentSelect}
          onProjectSelect={handleProjectSelectByWorkspace}
          onChannelClick={handleChannelClick}
          onTicketClick={handleTicketSelect}
          onThreadSelect={handleThreadSelect}
          onOpenTab={handleOpenTab}
          onProjectsChanged={bumpProjectsVersion}
        />
      </ErrorBoundary>
      <CreateProjectDialog
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
        onCreated={handleProjectCreated}
        defaultWorkspaceId={activeWorkspaceId}
      />
      <CreateTicketDialog
        open={createTicketOpen}
        onOpenChange={setCreateTicketOpen}
        onCreated={(ticket) => {
          handleTicketSelect(ticket.id);
        }}
        defaultWorkspaceId={activeWorkspaceId}
      />
      <CreateChannelDialog
        open={createChannelOpen}
        onOpenChange={setCreateChannelOpen}
        onCreated={(channel) => {
          handleChannelSelect(channel.id, channel.workspaceId ?? activeWorkspaceId);
        }}
        defaultWorkspaceId={activeWorkspaceId}
      />
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        items={buildDefaultPaletteItems({
          openSettings: () => onNavigate('settings'),
          openShortcuts: () => { onNavigate('settings'); requestOpenSection('keyboard'); },
          newProject: () => setCreateProjectOpen(true),
          newTicket: handleCreateTicket,
          openProjectsAll: () => openTab(buildTab('universal-projects', activeWorkspaceId, 'Projects')),
          openTicketsAll: handleCreateTicket,
          openChannelsAll: () => openTab(buildTab('universal-channels', activeWorkspaceId, 'Channels')),
          openAgentsAll: () => openTab(buildTab('universal-agents', activeWorkspaceId, 'Agents')),
          toggleTheme: handleToggleTheme,
          toggleLeftPanel: handleToggleLeftPanel,
          toggleRightPanel: handleToggleRightPanel,
        })}
      />
    </div>
  );
}
