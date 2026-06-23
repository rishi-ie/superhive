import type { CenterTab, CenterTabType, TabState } from './interface';

export function makeInitialTabState(defaultWorkspaceId: string): TabState {
  const id = crypto.randomUUID();
  return {
    tabs: [{ id, type: 'projects', workspaceId: defaultWorkspaceId, selectedTicketId: null }],
    activeTabId: id,
  };
}

export function openTab(state: TabState, type: CenterTabType, workspaceId: string): TabState {
  const existing = state.tabs.find(t => t.type === type && t.workspaceId === workspaceId);
  if (existing) {
    return { ...state, activeTabId: existing.id };
  }
  const newTab: CenterTab = {
    id: crypto.randomUUID(),
    type,
    workspaceId,
    selectedTicketId: null,
  };
  return {
    tabs: [...state.tabs, newTab],
    activeTabId: newTab.id,
  };
}

export function closeTab(state: TabState, tabId: string): TabState {
  const idx = state.tabs.findIndex(t => t.id === tabId);
  if (idx === -1) return state;
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

export function setTicketOnTab(state: TabState, tabId: string, ticketId: string | null): TabState {
  return {
    ...state,
    tabs: state.tabs.map(t => t.id === tabId ? { ...t, selectedTicketId: ticketId } : t),
  };
}

export function getActiveTab(state: TabState): CenterTab | null {
  return state.tabs.find(t => t.id === state.activeTabId) ?? null;
}

export function findTab(state: TabState, type: CenterTabType, workspaceId: string): CenterTab | null {
  return state.tabs.find(t => t.type === type && t.workspaceId === workspaceId) ?? null;
}
