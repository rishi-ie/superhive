import * as React from "react";
import { PlusIcon, XIcon } from "@phosphor-icons/react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { RightSidebarTabDefinition } from "./right-sidebar-tabs";
import {
  closeWorkspaceTab,
  normalizeWorkspaceState,
  openWorkspaceTab,
  readWorkspaceState,
  writeWorkspaceState,
} from "./right-sidebar-workspace-state";

interface RightSidebarWorkspaceProps<TTabId extends string> {
  contextKey: string;
  tabs: readonly RightSidebarTabDefinition<TTabId>[];
  renderTab: (tabId: TTabId) => React.ReactNode;
}

export function RightSidebarWorkspace<TTabId extends string>({
  contextKey,
  tabs,
  renderTab,
}: RightSidebarWorkspaceProps<TTabId>) {
  const tabIds = React.useMemo(() => tabs.map((tab) => tab.id), [tabs]);
  const tabIdsKey = tabIds.join("|");
  const [state, setState] = React.useState(() => readWorkspaceState(contextKey, tabIds));
  const tabRefs = React.useRef(new Map<string, HTMLButtonElement>());

  React.useEffect(() => {
    setState((current) => normalizeWorkspaceState(current, tabIds));
  }, [tabIds, tabIdsKey]);

  React.useEffect(() => {
    writeWorkspaceState(contextKey, state);
  }, [contextKey, state]);

  const openTab = React.useCallback((tabId: TTabId) => {
    setState((current) => openWorkspaceTab(current, tabId, tabIds));
  }, [tabIds]);

  const closeTab = React.useCallback((tabId: TTabId) => {
    setState((current) => closeWorkspaceTab(current, tabId));
  }, []);

  const showLauncher = React.useCallback(() => {
    setState((current) => ({ ...current, activeTab: null }));
  }, []);

  const focusTab = React.useCallback((tabId: TTabId) => {
    openTab(tabId);
    requestAnimationFrame(() => tabRefs.current.get(tabId)?.focus());
  }, [openTab]);

  const moveFocus = React.useCallback((currentTab: TTabId, direction: -1 | 1) => {
    const index = state.openTabs.indexOf(currentTab);
    if (index === -1) return;
    const nextIndex = (index + direction + state.openTabs.length) % state.openTabs.length;
    const nextTab = state.openTabs[nextIndex] as TTabId | undefined;
    if (nextTab) focusTab(nextTab);
  }, [focusTab, state.openTabs]);

  const handleTabKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLButtonElement>, tabId: TTabId) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveFocus(tabId, 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveFocus(tabId, -1);
    } else if (event.key === "Home") {
      event.preventDefault();
      const firstTab = state.openTabs[0] as TTabId | undefined;
      if (firstTab) focusTab(firstTab);
    } else if (event.key === "End") {
      event.preventDefault();
      const lastTab = state.openTabs[state.openTabs.length - 1] as TTabId | undefined;
      if (lastTab) focusTab(lastTab);
    }
  }, [focusTab, moveFocus, state.openTabs]);

  const openTabs = tabs.filter((tab) => state.openTabs.includes(tab.id));
  const activeTab = state.activeTab
    ? tabs.find((tab) => tab.id === state.activeTab)
    : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {openTabs.length > 0 && (
        <div className="mt-2 flex h-8 shrink-0 items-center gap-1 px-2 pr-14">
          <div aria-label="Open workspace tabs" className="flex min-w-0 max-w-[calc(100%-1.75rem)] items-stretch gap-1 overflow-x-auto" role="tablist">
            {openTabs.map((tab, index) => {
              const selected = tab.id === activeTab?.id;
              return (
                <div
                  key={tab.id}
                  className={cn(
                    "flex h-8 min-w-0 max-w-40 items-center rounded-md border border-transparent transition-colors",
                    selected
                      ? "bg-muted/80 text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <button
                    ref={(node) => {
                      if (node) tabRefs.current.set(tab.id, node);
                      else tabRefs.current.delete(tab.id);
                    }}
                    aria-controls={`right-sidebar-panel-${tab.id}`}
                    aria-selected={selected}
                    className="flex min-w-0 flex-1 items-center gap-1.5 px-2 text-sm font-medium outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    id={`right-sidebar-tab-${tab.id}`}
                    onClick={() => openTab(tab.id)}
                    onKeyDown={(event) => handleTabKeyDown(event, tab.id)}
                    role="tab"
                    tabIndex={selected || (!activeTab && index === 0) ? 0 : -1}
                    type="button"
                  >
                    <Icon icon={tab.icon} className="size-3.5 shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                  <button
                    aria-label={`Close ${tab.label} tab`}
                    className="mr-1 flex size-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-background/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    onClick={() => closeTab(tab.id)}
                    type="button"
                  >
                    <Icon icon={XIcon} className="size-3" />
                  </button>
                </div>
              );
            })}
          </div>
          <button
            aria-label="Open workspace launcher"
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            onClick={showLauncher}
            type="button"
          >
            <Icon icon={PlusIcon} className="size-4" />
          </button>
        </div>
      )}

      {activeTab ? (
        <div
          aria-labelledby={`right-sidebar-tab-${activeTab.id}`}
          className="flex min-h-0 flex-1 flex-col"
          id={`right-sidebar-panel-${activeTab.id}`}
          role="tabpanel"
        >
          {renderTab(activeTab.id)}
        </div>
      ) : (
        <WorkspaceLauncher tabs={tabs} onOpenTab={openTab} />
      )}
    </div>
  );
}

function WorkspaceLauncher<TTabId extends string>({
  tabs,
  onOpenTab,
}: {
  tabs: readonly RightSidebarTabDefinition<TTabId>[];
  onOpenTab: (tabId: TTabId) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 items-center px-4 pb-8">
      <div className="flex w-full flex-col gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className="group flex min-h-14 w-full items-center gap-3 rounded-xl border border-transparent bg-muted/35 px-3.5 text-left transition-colors hover:border-border hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            onClick={() => onOpenTab(tab.id)}
            type="button"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background/60 text-muted-foreground transition-colors group-hover:text-foreground">
              <Icon icon={tab.icon} className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">{tab.label}</span>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">{tab.description}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
