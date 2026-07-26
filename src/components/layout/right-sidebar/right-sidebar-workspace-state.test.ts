import { expect, test } from "bun:test";
import {
  closeWorkspaceTab,
  normalizeWorkspaceState,
  openWorkspaceTab,
  workspaceStorageKey,
} from "./right-sidebar-workspace-state";

const tabIds = ["overview", "manage", "inbox"] as const;

test("opens a tab once and keeps the registry order", () => {
  const state = openWorkspaceTab(
    { openTabs: ["overview"], activeTab: "overview" },
    "manage",
    tabIds,
  );
  const duplicate = openWorkspaceTab(state, "manage", tabIds);

  expect(duplicate).toEqual({ openTabs: ["overview", "manage"], activeTab: "manage" });
});

test("closing the active tab selects its next neighbor, then its previous neighbor", () => {
  const middle = closeWorkspaceTab(
    { openTabs: ["overview", "manage", "inbox"], activeTab: "manage" },
    "manage",
  );
  const last = closeWorkspaceTab(
    { openTabs: ["overview", "inbox"], activeTab: "inbox" },
    "inbox",
  );
  const only = closeWorkspaceTab({ openTabs: ["overview"], activeTab: "overview" }, "overview");

  expect(middle).toEqual({ openTabs: ["overview", "inbox"], activeTab: "inbox" });
  expect(last).toEqual({ openTabs: ["overview"], activeTab: "overview" });
  expect(only).toEqual({ openTabs: [], activeTab: null });
});

test("normalizes malformed and stale persisted layouts", () => {
  expect(normalizeWorkspaceState("not an object", tabIds)).toEqual({ openTabs: [], activeTab: null });
  expect(normalizeWorkspaceState({
    openTabs: ["inbox", "missing", "overview", "overview"],
    activeTab: "missing",
  }, tabIds)).toEqual({
    openTabs: ["overview", "inbox"],
    activeTab: null,
  });
});

test("preserves the launcher state while retaining open tabs", () => {
  expect(normalizeWorkspaceState({ openTabs: ["overview", "manage"], activeTab: null }, tabIds)).toEqual({
    openTabs: ["overview", "manage"],
    activeTab: null,
  });
});

test("uses isolated persistence keys for each workspace context", () => {
  expect(workspaceStorageKey("agent:alpha")).not.toBe(workspaceStorageKey("project:alpha"));
});
