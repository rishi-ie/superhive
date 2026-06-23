import type { CenterTab, CenterTabType, TabState } from './interface';

export function makeInitialTabState(defaultWorkspaceId: string): TabState {
  const id = crypto.randomUUID();
  return {
    tabs: [{ id, type: 'projects', workspaceId: defaultWorkspaceId, selectedTicketId: null, selectedProjectId: null, selectedChannelId: null }],
    activeTabId: id,
  };
}

export function openTab(state: TabState, type: CenterTabType, workspaceId: string): TabState {
  const existing = state.tabs.find(t => t.type === type && t.workspaceId === workspaceId && !t.selectedProjectId && !t.selectedChannelId);
  if (existing) {
    return { ...state, activeTabId: existing.id };
  }
  const newTab: CenterTab = {
    id: crypto.randomUUID(),
    type,
    workspaceId,
    selectedTicketId: null,
    selectedProjectId: null,
    selectedChannelId: null,
  };
  return {
    tabs: [...state.tabs, newTab],
    activeTabId: newTab.id,
  };
}

export function openProjectTab(state: TabState, projectId: string, workspaceId: string): TabState {
  const existing = state.tabs.find(t => t.type === 'project' && t.selectedProjectId === projectId);
  if (existing) {
    return { ...state, activeTabId: existing.id };
  }
  const newTab: CenterTab = {
    id: crypto.randomUUID(),
    type: 'project',
    workspaceId,
    selectedTicketId: null,
    selectedProjectId: projectId,
    selectedChannelId: null,
  };
  return {
    tabs: [...state.tabs, newTab],
    activeTabId: newTab.id,
  };
}

export function openChannelTab(state: TabState, channelId: string, workspaceId: string): TabState {
  const existing = state.tabs.find(t => t.type === 'channel' && t.selectedChannelId === channelId);
  if (existing) {
    return { ...state, activeTabId: existing.id };
  }
  const newTab: CenterTab = {
    id: crypto.randomUUID(),
    type: 'channel',
    workspaceId,
    selectedTicketId: null,
    selectedProjectId: null,
    selectedChannelId: channelId,
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

export function setProjectOnTab(state: TabState, tabId: string, projectId: string | null): TabState {
  return {
    ...state,
    tabs: state.tabs.map(t => t.id === tabId ? { ...t, selectedProjectId: projectId } : t),
  };
}

export function setChannelOnTab(state: TabState, tabId: string, channelId: string | null): TabState {
  return {
    ...state,
    tabs: state.tabs.map(t => t.id === tabId ? { ...t, selectedChannelId: channelId } : t),
  };
}

export function getActiveTab(state: TabState): CenterTab | null {
  return state.tabs.find(t => t.id === state.activeTabId) ?? null;
}

export function findTab(state: TabState, type: CenterTabType, workspaceId: string): CenterTab | null {
  return state.tabs.find(t => t.type === type && t.workspaceId === workspaceId) ?? null;
}
