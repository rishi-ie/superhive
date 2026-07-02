/**
 * useGlobalShortcuts — single window keydown listener + dispatcher.
 *
 * Owns the entirety of keyboard shortcut handling in the app. Mounted once
 * from `Dashboard.tsx` with the full ShortcutAPI; anywhere else that needs
 * shortcuts adds a handler via the registry (`registry.ts` + `actions.ts`).
 */
import { useEffect, useMemo } from 'react';
import {
  DEFAULT_SHORTCUTS,
  getShortcutById,
  runRegistryValidation,
  type ShortcutDef,
} from './registry';
import { ACTIONS } from './actions';
import {
  chordForPlatform,
  eventToChord,
  isDialogOpen,
  isInputTarget,
  normalizeChord,
} from './chord';
import { detectPlatform, type Platform } from './platform';

import type { CenterTab } from '@/data/tab/interface';
import type { Page } from '@/App';
import type { RightPanelTabId } from '@/data/config/right-panel-tabs';

/**
 * Surface that shortcut handlers call into. Everything a shortcut might
 * affect lives here. Produced once in `Dashboard.tsx` and consumed by the
 * global keydown hook.
 */
export type ShortcutAPI = {
  // Navigation
  navigate: (page: Page) => void;
  isOnSettingsPage: boolean;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  focusSearch: () => void;

  // Palette
  openPalette: () => void;
  closePalette: () => void;
  isPaletteOpen: boolean;

  // Settings
  requestOpenSection: (id: string) => void;
  toggleTheme: () => void;

  // Tabs
  activeWorkspaceId: string;
  tabs: CenterTab[];
  activeTab: CenterTab | null;
  activeTabId: string | null;
  handleTabClick: (id: string) => void;
  handleTabClickByIndex: (n: number) => void;
  handleTabClose: (id: string) => void;
  closeOtherTabs: () => void;
  openOrFocusTab: (tab: Omit<CenterTab, 'id' | 'createdAt'>) => void;
  openNewTabMenu: () => void;
  togglePin: () => void;

  // Right Panel
  setRightPanelTab: (id: RightPanelTabId) => void;

  // Projects
  openProjectDialog: () => void;

  // Tickets
  openTicketDialog: () => void;

  // Channels
  openChannelDialog: () => void;

  // Chat
  sendActiveChatMessage: () => void;
  focusChatInput: () => void;

  // Modals
  confirmActiveModal: () => void;
};

export type ShortcutOptions = {
  /**
   * Override platform detection — useful for tests and previews.
   */
  platform?: Platform;
};

/**
 * Mount a global keydown listener that dispatches matching shortcuts to
 * their handlers via the ShortcutAPI.
 */
export function useGlobalShortcuts(api: ShortcutAPI, opts: ShortcutOptions = {}): void {
  const platform: Platform = opts.platform ?? detectPlatform();

  // Run dev-mode validation once on mount. Pure-pretend wrap avoids spamming
  // the same warning on every render.
  useEffect(() => {
    runRegistryValidation();
  }, []);

  const dispatch = useMemo(() => {
    return (event: KeyboardEvent) => {
      const target = event.target;
      const dialogOpen = isDialogOpen();
      const inInput = isInputTarget(target);

      for (const def of DEFAULT_SHORTCUTS) {
        const chordRaw = chordForPlatform(def.chord, platform);
        const expected = normalizeChord(chordRaw);
        const actual = eventToChord(event, platform);
        if (expected !== actual) continue;
        if (actual === '') continue;

        // Scope gating
        if (inInput && def.scope !== 'always') return;
        if (dialogOpen && def.scope !== 'always') {
          // Allow Escape to dismiss even when a dialog is open.
          if (def.id !== 'nav.escape') return;
        }
        if (def.scope === 'in-canvas' && api.isOnSettingsPage) return;

        const handler = ACTIONS[def.handles ?? def.id];
        if (!handler) {
          console.warn(`[shortcuts] No handler registered for "${def.id}"`);
          continue;
        }

        event.preventDefault();
        handler(api);
        return;
      }
    };
    // Re-create if platform changes (rare) — basic handler closure refs ok.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform, api]);

  useEffect(() => {
    window.addEventListener('keydown', dispatch);
    return () => window.removeEventListener('keydown', dispatch);
  }, [dispatch]);
}

/**
 * Pure helper exposed for tests: returns the id of the shortcut matched by
 * an event, if any. Does not consider scope gating.
 */
export function matchShortcutForTest(event: KeyboardEvent, platform: Platform = detectPlatform()): ShortcutDef | null {
  const actual = eventToChord(event, platform);
  if (actual === '') return null;
  for (const def of DEFAULT_SHORTCUTS) {
    const expected = normalizeChord(chordForPlatform(def.chord, platform));
    if (expected === actual) return def;
  }
  return null;
}

/** For action lookups by shortcut id (handy for inline help search). */
export function getActionFor(id: string): ((api: ShortcutAPI) => void) | undefined {
  const def = getShortcutById(id);
  if (!def) return undefined;
  return ACTIONS[def.handles ?? def.id];
}
