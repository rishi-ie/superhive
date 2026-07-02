/**
 * Pure tab state transition functions extracted from data/tab/store.ts.
 * These functions operate on immutable TabState objects without any DataSource calls.
 */
import type { CenterTab, CenterTabType, TabState, TabSelection } from '@/data/tab/interface';

function matchesKey(tab: CenterTab, type: CenterTabType, workspaceId: string, entityId?: string | null): boolean {
  if (tab.type !== type) return false;
  if (tab.type === 'project') return tab.selectedProjectId === entityId;
  if (tab.type === 'channel') return tab.selectedChannelId === entityId;
  if (tab.type === 'agent') return tab.selectedAgentId === entityId;
  if (tab.type === 'universal-agents' || tab.type === 'universal-projects' || tab.type === 'universal-channels') return true;
  return tab.workspaceId === workspaceId;
}

/**
 * @param workspaceId - Workspace id to seed the home tab with
 * @returns Initial TabState with a pinned Home tab for the given workspace
 */
export function makeInitialTabState(workspaceId: string): TabState {
  const id = crypto.randomUUID();
  return {
    tabs: [
      {
        id,
        type: 'home',
        workspaceId,
        title: 'Home',
        pinned: true,
        selectedAgentId: null,
        selectedProjectId: null,
        selectedTicketId: null,
        selectedChannelId: null,
        createdAt: Date.now(),
      },
    ],
    activeTabId: id,
  };
}

/**
 * @param state - Current tab state
 * @param partial - Partial tab data (without id/createdAt)
 * @returns New state with tab focused (or opened if it doesn't exist)
 */
export function openOrFocusTab(state: TabState, partial: Omit<CenterTab, 'id' | 'createdAt'>): TabState {
  const entityId =
    partial.selectedAgentId ??
    partial.selectedProjectId ??
    partial.selectedTicketId ??
    partial.selectedChannelId ??
    null;

  const existing = state.tabs.find(t => matchesKey(t, partial.type, partial.workspaceId, entityId));
  if (existing) {
    return { ...state, activeTabId: existing.id };
  }

  const newTab: CenterTab = {
    ...partial,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    selectedAgentId: partial.selectedAgentId ?? null,
    selectedProjectId: partial.selectedProjectId ?? null,
    selectedTicketId: partial.selectedTicketId ?? null,
    selectedChannelId: partial.selectedChannelId ?? null,
  };

  return {
    tabs: [...state.tabs, newTab],
    activeTabId: newTab.id,
  };
}

/**
 * @param state - Current tab state
 * @param tabId - Tab id to close (pinned tabs are skipped)
 * @returns New state with tab removed; active tab auto-advances if needed
 */
export function closeTab(state: TabState, tabId: string): TabState {
  const idx = state.tabs.findIndex(t => t.id === tabId);
  if (idx === -1) return state;

  const tab = state.tabs[idx]!;
  if (tab.pinned) return state;

  const newTabs = state.tabs.filter(t => t.id !== tabId);
  if (newTabs.length === 0) {
    return { tabs: [], activeTabId: null };
  }

  let newActiveTabId = state.activeTabId;
  if (state.activeTabId === tabId) {
    newActiveTabId = newTabs[idx]?.id ?? newTabs[idx - 1]?.id ?? null;
  }

  return { tabs: newTabs, activeTabId: newActiveTabId };
}

/**
 * @param state - Current tab state
 * @param tabId - Tab id to make active
 * @returns New state with updated active tab id
 */
export function selectTab(state: TabState, tabId: string): TabState {
  return { ...state, activeTabId: tabId };
}

/**
 * @param state - Current tab state
 * @param tabId - Tab id to update selection on
 * @param selection - Partial selection to merge into the tab
 * @returns New state with updated tab selection
 */
export function setSelection(state: TabState, tabId: string, selection: Partial<TabSelection>): TabState {
  return {
    ...state,
    tabs: state.tabs.map(t =>
      t.id === tabId
        ? {
            ...t,
            selectedAgentId: selection.selectedAgentId ?? t.selectedAgentId,
            selectedProjectId: selection.selectedProjectId ?? t.selectedProjectId,
            selectedTicketId: selection.selectedTicketId ?? t.selectedTicketId,
            selectedChannelId: selection.selectedChannelId ?? t.selectedChannelId,
          }
        : t,
    ),
  };
}

/**
 * @param state - Current tab state
 * @param tabId - Tab id to pin/unpin
 * @param pinned - Whether to pin (true) or unpin (false)
 * @returns New state with updated pin status
 */
export function pinTab(state: TabState, tabId: string, pinned: boolean): TabState {
  return { ...state, tabs: state.tabs.map(t => t.id === tabId ? { ...t, pinned } : t) };
}

/**
 * @param state - Tab state to query
 * @returns Currently active tab, or null if no tabs
 */
export function getActiveTab(state: TabState): CenterTab | null {
  return state.tabs.find(t => t.id === state.activeTabId) ?? null;
}

/**
 * @param state - Tab state to search
 * @param type - Tab type to look for
 * @param workspaceId - Optional workspace filter
 * @param entityId - Optional entity id filter (project/agent/channel/ticket id)
 * @returns Matching tab, or null
 */
export function findTab(state: TabState, type: CenterTabType, workspaceId?: string, entityId?: string | null): CenterTab | null {
  return state.tabs.find(t => matchesKey(t, type, workspaceId ?? t.workspaceId, entityId)) ?? null;
}
