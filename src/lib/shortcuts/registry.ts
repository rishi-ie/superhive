/**
 * Master keyboard shortcut registry — THE single source of truth.
 *
 * To add/remove/change a keyboard shortcut in Superhive, edit this file.
 * Handlers are wired in `handlers.ts`; this file is pure data.
 *
 * Conventions:
 *  - `id`              : stable string identifier (kebab/path style).
 *  - `category`        : grouping for the settings page + help docs.
 *  - `label`           : short human-readable title.
 *  - `description`     : one-line explanation (shown as subtitle in settings).
 *  - `chord`           : { mac, default } — most use the same string in both.
 *                        `Mod` = Cmd on Mac, Ctrl elsewhere.
 *  - `scope`           : 'global'  = fire only when not in inputs/dialogs (default)
 *                        'always'  = fire even in inputs/dialogs (e.g. send)
 *                        'in-canvas' = fire only when a center tab is active (skip on settings)
 *  - `handles?`        : Optional callback id used to look up the handler in `actions.ts`.
 *                        If omitted, the id is used as the action name.
 *  - `meta`            : optional structured extras (badge, hidden, etc.)
 */
import type { Chord } from './chord';

export type ShortcutScope = 'global' | 'always' | 'in-canvas';

export type ShortcutCategory =
  | 'global'
  | 'navigation'
  | 'tabs'
  | 'panels'
  | 'projects'
  | 'tickets'
  | 'channels'
  | 'agents'
  | 'chat'
  | 'modals';

export type ShortcutDef = {
  id: string;
  category: ShortcutCategory;
  label: string;
  description: string;
  chord: Chord;
  scope: ShortcutScope;
  /** Lookup key in `actions.ts`. Defaults to `id`. */
  handles?: string;
  /** Optional badge-like metadata. */
  meta?: {
    /** Show a small chip in the settings page (e.g. "loop", "new"). */
    tag?: string;
  };
};

export const CATEGORY_ORDER: ShortcutCategory[] = [
  'global',
  'navigation',
  'tabs',
  'panels',
  'projects',
  'tickets',
  'channels',
  'agents',
  'chat',
  'modals',
];

const chord = (mac: string, defaultChord: string = mac): Chord => ({ mac, default: defaultChord });

export const DEFAULT_SHORTCUTS: ShortcutDef[] = [
  // ─── Global ────────────────────────────────────────────────────────
  {
    id: 'palette.open',
    category: 'global',
    label: 'Open command palette',
    description: 'Search and run any action across Superhive.',
    chord: chord('Mod+k'),
    scope: 'global',
  },
  {
    id: 'settings.open',
    category: 'global',
    label: 'Open settings',
    description: 'Open the settings screen.',
    chord: chord('Mod+,'),
    scope: 'global',
  },
  {
    id: 'shortcuts.open',
    category: 'global',
    label: 'Open keyboard shortcuts',
    description: 'Open this very list of shortcuts.',
    chord: chord('Mod+?', 'Mod+Shift+/'),
    scope: 'global',
  },
  {
    id: 'app.theme.toggle',
    category: 'global',
    label: 'Toggle theme',
    description: 'Switch between dark and light appearance.',
    chord: chord('Mod+Alt+t'),
    scope: 'global',
  },

  // ─── Navigation ────────────────────────────────────────────────────
  {
    id: 'nav.left-panel.toggle',
    category: 'navigation',
    label: 'Toggle left panel',
    description: 'Show or hide the Fleet sidebar.',
    chord: chord('Mod+Alt+s'),
    scope: 'global',
  },
  {
    id: 'nav.right-panel.toggle',
    category: 'navigation',
    label: 'Toggle right panel',
    description: 'Show or hide the Avionics panel.',
    chord: chord('Mod+Alt+b'),
    scope: 'global',
  },
  {
    id: 'nav.focus-search',
    category: 'navigation',
    label: 'Focus search',
    description: 'Focus the global search bar.',
    chord: chord('Mod+/'),
    scope: 'global',
  },
  {
    id: 'nav.escape',
    category: 'navigation',
    label: 'Back / dismiss',
    description: 'Close overlays, popovers, or return from settings.',
    chord: chord('Escape'),
    scope: 'always',
  },

  // ─── Tabs ──────────────────────────────────────────────────────────
  {
    id: 'tab.new',
    category: 'tabs',
    label: 'New tab',
    description: 'Open the new tab menu.',
    chord: chord('Mod+t'),
    scope: 'global',
  },
  {
    id: 'tab.close',
    category: 'tabs',
    label: 'Close tab',
    description: 'Close the currently focused tab.',
    chord: chord('Mod+w'),
    scope: 'global',
  },
  {
    id: 'tab.close-others',
    category: 'tabs',
    label: 'Close all other tabs',
    description: 'Close every tab except the active and pinned ones.',
    chord: chord('Mod+Shift+w'),
    scope: 'global',
  },
  {
    id: 'tab.pin',
    category: 'tabs',
    label: 'Pin active tab',
    description: 'Pin or unpin the currently focused tab.',
    chord: chord('Mod+Shift+l'),
    scope: 'global',
  },
  {
    id: 'tab.cycle.1',
    category: 'tabs',
    label: 'Switch to tab 1',
    description: 'Jump to the first tab.',
    chord: chord('Mod+1'),
    scope: 'global',
  },
  {
    id: 'tab.cycle.2',
    category: 'tabs',
    label: 'Switch to tab 2',
    description: 'Jump to the second tab.',
    chord: chord('Mod+2'),
    scope: 'global',
  },
  {
    id: 'tab.cycle.3',
    category: 'tabs',
    label: 'Switch to tab 3',
    description: 'Jump to the third tab.',
    chord: chord('Mod+3'),
    scope: 'global',
  },
  {
    id: 'tab.cycle.4',
    category: 'tabs',
    label: 'Switch to tab 4',
    description: 'Jump to the fourth tab.',
    chord: chord('Mod+4'),
    scope: 'global',
  },
  {
    id: 'tab.cycle.5',
    category: 'tabs',
    label: 'Switch to tab 5',
    description: 'Jump to the fifth tab.',
    chord: chord('Mod+5'),
    scope: 'global',
  },
  {
    id: 'tab.cycle.6',
    category: 'tabs',
    label: 'Switch to tab 6',
    description: 'Jump to the sixth tab.',
    chord: chord('Mod+6'),
    scope: 'global',
  },
  {
    id: 'tab.cycle.7',
    category: 'tabs',
    label: 'Switch to tab 7',
    description: 'Jump to the seventh tab.',
    chord: chord('Mod+7'),
    scope: 'global',
  },
  {
    id: 'tab.cycle.8',
    category: 'tabs',
    label: 'Switch to tab 8',
    description: 'Jump to the eighth tab.',
    chord: chord('Mod+8'),
    scope: 'global',
  },
  {
    id: 'tab.cycle.9',
    category: 'tabs',
    label: 'Switch to tab 9',
    description: 'Jump to the ninth tab.',
    chord: chord('Mod+9'),
    scope: 'global',
  },

  // ─── Right Panel ───────────────────────────────────────────────────
  {
    id: 'panel.overview',
    category: 'panels',
    label: 'Open Overview tab',
    description: 'Open the right-panel Overview tab.',
    chord: chord('Mod+Shift+o'),
    scope: 'global',
  },
  {
    id: 'panel.manage',
    category: 'panels',
    label: 'Open Manage tab',
    description: 'Open the right-panel Manage tab.',
    chord: chord('Mod+Shift+e'),
    scope: 'global',
  },
  {
    id: 'panel.inbox',
    category: 'panels',
    label: 'Open Inbox tab',
    description: 'Open the right-panel Inbox tab.',
    chord: chord('Mod+Shift+i'),
    scope: 'global',
  },
  {
    id: 'panel.sessions',
    category: 'panels',
    label: 'Open Sessions tab',
    description: 'Open the right-panel Sessions tab.',
    chord: chord('Mod+Shift+l'),
    scope: 'global',
  },

  // ─── Projects ──────────────────────────────────────────────────────
  {
    id: 'project.new',
    category: 'projects',
    label: 'New project',
    description: 'Open the new project dialog.',
    chord: chord('Mod+Shift+n'),
    scope: 'global',
  },
  {
    id: 'project.universal',
    category: 'projects',
    label: 'All projects',
    description: 'Open the universal Projects view.',
    chord: chord('Mod+Shift+p'),
    scope: 'global',
  },

  // ─── Tickets ───────────────────────────────────────────────────────
  {
    id: 'ticket.new',
    category: 'tickets',
    label: 'New ticket',
    description: 'Focus the new-ticket composer on the Tickets view.',
    chord: chord('Mod+Shift+t'),
    scope: 'global',
  },
  {
    id: 'ticket.universal',
    category: 'tickets',
    label: 'All tickets',
    description: 'Open the universal Tickets view.',
    chord: chord('Mod+Shift+k'),
    scope: 'global',
  },

  // ─── Channels ──────────────────────────────────────────────────────
  {
    id: 'channel.universal',
    category: 'channels',
    label: 'All channels',
    description: 'Open the universal Channels view.',
    chord: chord('Mod+Shift+h'),
    scope: 'global',
  },

  // ─── Agents ────────────────────────────────────────────────────────
  {
    id: 'agent.universal',
    category: 'agents',
    label: 'All agents',
    description: 'Open the universal Agents view.',
    chord: chord('Mod+Shift+a'),
    scope: 'global',
  },

  // ─── Chat ──────────────────────────────────────────────────────────
  {
    id: 'chat.send',
    category: 'chat',
    label: 'Send message',
    description: 'Send the current message in chat or channel inputs.',
    chord: chord('Mod+Enter'),
    scope: 'always',
  },
  {
    id: 'chat.newline',
    category: 'chat',
    label: 'New line',
    description: 'Insert a newline inside the chat input.',
    chord: chord('Shift+Enter'),
    scope: 'always',
  },
  {
    id: 'chat.focus',
    category: 'chat',
    label: 'Focus chat input',
    description: 'Focus the chat composer in the active chat tab.',
    chord: chord('Mod+i'),
    scope: 'in-canvas',
  },

  // ─── Modals ────────────────────────────────────────────────────────
  {
    id: 'modal.confirm',
    category: 'modals',
    label: 'Confirm',
    description: 'Submit the focused modal or form.',
    chord: chord('Mod+Enter'),
    scope: 'always',
  },
];

// ─── Lookups ─────────────────────────────────────────────────────────

let _byId: Map<string, ShortcutDef> | null = null;
let _byCategory: Map<ShortcutCategory, ShortcutDef[]> | null = null;

export function getShortcutById(id: string): ShortcutDef | undefined {
  if (!_byId) _byId = new Map(DEFAULT_SHORTCUTS.map(s => [s.id, s]));
  return _byId.get(id);
}

export function getShortcutsByCategory(): Record<ShortcutCategory, ShortcutDef[]> {
  if (!_byCategory) {
    _byCategory = new Map();
    for (const s of DEFAULT_SHORTCUTS) {
      const arr = _byCategory.get(s.category) ?? [];
      arr.push(s);
      _byCategory.set(s.category, arr);
    }
  }
  const result = {} as Record<ShortcutCategory, ShortcutDef[]>;
  for (const cat of CATEGORY_ORDER) {
    result[cat] = _byCategory.get(cat) ?? [];
  }
  return result;
}

// ─── Validation (dev only) ───────────────────────────────────────────
// Build a string-keyed map of `chord-string-per-platform → id` and throw on
// conflicts so that typos + accidental overlaps fail loudly during development.

type ConflictReport = {
  perPlatform: { platform: 'mac' | 'default'; idA: string; idB: string; chord: string }[];
  duplicateIds: string[];
};

export function validateRegistry(): ConflictReport {
  const report: ConflictReport = { perPlatform: [], duplicateIds: [] };
  const seenIds = new Set<string>();
  const seenMac = new Map<string, string>();
  const seenDefault = new Map<string, string>();

  for (const def of DEFAULT_SHORTCUTS) {
    if (seenIds.has(def.id)) {
      report.duplicateIds.push(def.id);
    }
    seenIds.add(def.id);

    const macKey = def.chord.mac;
    const defaultKey = def.chord.default;

    if (seenMac.has(macKey) && seenMac.get(macKey) !== def.id) {
      report.perPlatform.push({
        platform: 'mac',
        idA: seenMac.get(macKey)!,
        idB: def.id,
        chord: macKey,
      });
    } else {
      seenMac.set(macKey, def.id);
    }

    if (defaultKey !== macKey) {
      if (seenDefault.has(defaultKey) && seenDefault.get(defaultKey) !== def.id) {
        report.perPlatform.push({
          platform: 'default',
          idA: seenDefault.get(defaultKey)!,
          idB: def.id,
          chord: defaultKey,
        });
      } else {
        seenDefault.set(defaultKey, def.id);
      }
    }
  }

  return report;
}

export function runRegistryValidation(): void {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') return;
  const report = validateRegistry();
  if (report.duplicateIds.length > 0) {
    console.error('[shortcuts/registry] Duplicate IDs:', report.duplicateIds);
  }
  if (report.perPlatform.length > 0) {
    const lines = report.perPlatform.map(
      c => `  ${c.platform}: "${c.chord}" ↔ ${c.idA} and ${c.idB}`,
    );
    console.error('[shortcuts/registry] Chord collisions:\n' + lines.join('\n'));
  }
}
