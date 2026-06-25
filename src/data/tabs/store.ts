import type { CenterTab, CenterTabType, TabState, TabSelection } from './interface';

function matchesKey(tab: CenterTab, type: CenterTabType, workspaceId: string, entityId?: string | null): boolean {
  if (tab.type !== type) return false;
  if (tab.type === 'project') return tab.selectedProjectId === entityId;
  if (tab.type === 'channel') return tab.selectedChannelId === entityId;
  if (tab.type === 'agent') return tab.selectedAgentId === entityId;
  if (tab.type === 'universal-agents' || tab.type === 'universal-projects' || tab.type === 'universal-channels') return true;
  return tab.workspaceId === workspaceId;
}

export function makeInitialTabState(workspaceId: string): TabState {
  const id = crypto.randomUUID();
  return {
    tabs: [
      {
        id,
        type: 'projects',
        workspaceId,
        title: 'Projects',
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

export function selectTab(state: TabState, tabId: string): TabState {
  return { ...state, activeTabId: tabId };
}

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

export function pinTab(state: TabState, tabId: string, pinned: boolean): TabState {
  return { ...state, tabs: state.tabs.map(t => t.id === tabId ? { ...t, pinned } : t) };
}

export function getActiveTab(state: TabState): CenterTab | null {
  return state.tabs.find(t => t.id === state.activeTabId) ?? null;
}

export function findTab(state: TabState, type: CenterTabType, workspaceId?: string, entityId?: string | null): CenterTab | null {
  return state.tabs.find(t => matchesKey(t, type, workspaceId ?? t.workspaceId, entityId)) ?? null;
}
