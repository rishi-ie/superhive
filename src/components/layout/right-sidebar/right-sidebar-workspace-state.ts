export interface RightSidebarWorkspaceState {
  openTabs: string[];
  activeTab: string | null;
}

const STORAGE_PREFIX = "superhive:right-sidebar-workspace:v1:";

export function workspaceStorageKey(contextKey: string): string {
  return `${STORAGE_PREFIX}${contextKey}`;
}

export function normalizeWorkspaceState(
  value: unknown,
  tabIds: readonly string[],
): RightSidebarWorkspaceState {
  const candidate = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const requestedTabs = Array.isArray(candidate.openTabs)
    ? candidate.openTabs.filter((tab): tab is string => typeof tab === "string")
    : [];
  const requested = new Set(requestedTabs);
  const openTabs = tabIds.filter((tabId) => requested.has(tabId));
  const activeTab = typeof candidate.activeTab === "string" && openTabs.includes(candidate.activeTab)
    ? candidate.activeTab
    : null;

  return { openTabs, activeTab };
}

export function openWorkspaceTab(
  state: RightSidebarWorkspaceState,
  tabId: string,
  tabIds: readonly string[],
): RightSidebarWorkspaceState {
  return normalizeWorkspaceState(
    { openTabs: [...state.openTabs, tabId], activeTab: tabId },
    tabIds,
  );
}

export function closeWorkspaceTab(
  state: RightSidebarWorkspaceState,
  tabId: string,
): RightSidebarWorkspaceState {
  const index = state.openTabs.indexOf(tabId);
  if (index === -1) return state;

  const openTabs = state.openTabs.filter((tab) => tab !== tabId);
  if (state.activeTab !== tabId) return { openTabs, activeTab: state.activeTab };

  return {
    openTabs,
    activeTab: openTabs[index] ?? openTabs[index - 1] ?? null,
  };
}

export function readWorkspaceState(
  contextKey: string,
  tabIds: readonly string[],
): RightSidebarWorkspaceState {
  if (typeof window === "undefined") return { openTabs: [], activeTab: null };

  try {
    const raw = window.localStorage.getItem(workspaceStorageKey(contextKey));
    return normalizeWorkspaceState(raw ? JSON.parse(raw) : null, tabIds);
  } catch {
    return { openTabs: [], activeTab: null };
  }
}

export function writeWorkspaceState(contextKey: string, state: RightSidebarWorkspaceState): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(workspaceStorageKey(contextKey), JSON.stringify(state));
  } catch {
    // Persistence is optional: a blocked or full localStorage must not break the sidebar.
  }
}
