/**
 * Shortcut actions — the actual handlers for each registered shortcut.
 *
 * Each action receives a `ShortcutAPI` (Dashboard-bound setters/callbacks) and
 * performs the corresponding side effect. Adding a new shortcut means adding
 * one handler here, then registering it in the ACTIONS map.
 */
import type { CenterTabType } from '@/data/tab/interface';
import type { ShortcutAPI } from './useGlobalShortcuts';

function buildTab(api: ShortcutAPI, type: CenterTabType, title: string) {
  return {
    type,
    workspaceId: api.activeWorkspaceId,
    title,
    pinned: false,
    modified: false,
    selectedAgentId: null,
    selectedProjectId: null,
    selectedTicketId: null,
    selectedChannelId: null,
  } as const;
}

// ─── Global ───────────────────────────────────────────────────────────
export const openPalette       = (api: ShortcutAPI) => api.openPalette();
export const openSettings      = (api: ShortcutAPI) => api.navigate('settings');
export const openShortcuts     = (api: ShortcutAPI) => { api.navigate('settings'); api.requestOpenSection('keyboard'); };
export const toggleTheme       = (api: ShortcutAPI) => api.toggleTheme();

// ─── Navigation ───────────────────────────────────────────────────────
export const toggleLeftPanel   = (api: ShortcutAPI) => api.toggleLeftPanel();
export const toggleRightPanel  = (api: ShortcutAPI) => api.toggleRightPanel();
export const focusSearch       = (api: ShortcutAPI) => api.focusSearch();
export const dismissOrBack     = (api: ShortcutAPI) => {
  if (api.isPaletteOpen) api.closePalette();
  else if (api.isOnSettingsPage) api.navigate('main');
};

// ─── Tabs ─────────────────────────────────────────────────────────────
export const newTab            = (api: ShortcutAPI) => api.openNewTabMenu();
export const closeTab          = (api: ShortcutAPI) => {
  if (api.activeTab && !api.activeTab.pinned) api.handleTabClose(api.activeTab.id);
};
export const closeOtherTabs    = (api: ShortcutAPI) => api.closeOtherTabs();
export const togglePin         = (api: ShortcutAPI) => api.togglePin();
export const makeCycleTab      = (n: number) => (api: ShortcutAPI) => api.handleTabClickByIndex(n);
export const cycleTab1         = makeCycleTab(1);
export const cycleTab2         = makeCycleTab(2);
export const cycleTab3         = makeCycleTab(3);
export const cycleTab4         = makeCycleTab(4);
export const cycleTab5         = makeCycleTab(5);
export const cycleTab6         = makeCycleTab(6);
export const cycleTab7         = makeCycleTab(7);
export const cycleTab8         = makeCycleTab(8);
export const cycleTab9         = makeCycleTab(9);

// ─── Right Panel ──────────────────────────────────────────────────────
export const openPanel = (id: 'overview' | 'manage' | 'inbox' | 'sessions') =>
  (api: ShortcutAPI) => api.setRightPanelTab(id);
export const openOverview    = openPanel('overview');
export const openManage      = openPanel('manage');
export const openInbox       = openPanel('inbox');
export const openSessions    = openPanel('sessions');

// ─── Projects ─────────────────────────────────────────────────────────
export const newProject      = (api: ShortcutAPI) => api.openProjectDialog();
export const openProjectsAll = (api: ShortcutAPI) => api.openOrFocusTab(buildTab(api, 'universal-projects', 'Projects'));

// ─── Tickets ──────────────────────────────────────────────────────────
export const newTicket       = (api: ShortcutAPI) => api.openTicketDialog();
export const openTicketsAll  = (api: ShortcutAPI) => api.openOrFocusTab(buildTab(api, 'tickets', 'Tickets'));

// ─── Channels ─────────────────────────────────────────────────────────
export const openChannelsAll = (api: ShortcutAPI) => api.openOrFocusTab(buildTab(api, 'universal-channels', 'Channels'));

// ─── Agents ───────────────────────────────────────────────────────────
export const openAgentsAll   = (api: ShortcutAPI) => api.openOrFocusTab(buildTab(api, 'universal-agents', 'Agents'));

// ─── Chat ─────────────────────────────────────────────────────────────
export const sendChat        = (api: ShortcutAPI) => api.sendActiveChatMessage();
export const focusChat       = (api: ShortcutAPI) => api.focusChatInput();

// ─── Modals ───────────────────────────────────────────────────────────
export const confirmModal    = (api: ShortcutAPI) => api.confirmActiveModal();

// Aggregated handler map keyed by action name.
export const ACTIONS: Record<string, (api: ShortcutAPI) => void> = {
  openPalette,
  openSettings,
  openShortcuts,
  toggleTheme,
  toggleLeftPanel,
  toggleRightPanel,
  focusSearch,
  dismissOrBack,
  newTab,
  closeTab,
  closeOtherTabs,
  togglePin,
  cycleTab1, cycleTab2, cycleTab3, cycleTab4, cycleTab5,
  cycleTab6, cycleTab7, cycleTab8, cycleTab9,
  openOverview,
  openManage,
  openInbox,
  openSessions,
  newProject,
  openProjectsAll,
  newTicket,
  openTicketsAll,
  openChannelsAll,
  openAgentsAll,
  sendChat,
  focusChat,
  confirmModal,
};

