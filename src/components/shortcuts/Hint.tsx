/**
 * User-facing components for displaying keyboard shortcuts.
 * All read from the registry, so adding a new shortcut only requires a registry entry.
 */
import { Command, Compass, AppWindow, PanelRight, Folder, ClipboardCheck, MessageSquare, Bot, MessageCircle, Square } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Kbd } from '@/components/ui/Kbd';
import { formatChord, formatChordText } from '@/lib/shortcuts/format';
import { chordForPlatform } from '@/lib/shortcuts/chord';
import { usePlatform } from '@/lib/shortcuts/platform';
import { getShortcutById, type ShortcutCategory } from '@/lib/shortcuts/registry';

export const CATEGORY_ICONS: Record<ShortcutCategory, { label: string; icon: LucideIcon }> = {
  global:     { label: 'Global',           icon: Command },
  navigation: { label: 'Navigation',       icon: Compass },
  tabs:       { label: 'Tabs',             icon: AppWindow },
  panels:     { label: 'Right Panel',      icon: PanelRight },
  projects:   { label: 'Projects',         icon: Folder },
  tickets:    { label: 'Tickets',          icon: ClipboardCheck },
  channels:   { label: 'Channels',         icon: MessageSquare },
  agents:     { label: 'Agents',           icon: Bot },
  chat:       { label: 'Chat',             icon: MessageCircle },
  modals:     { label: 'Modals & Dialogs', icon: Square },
};

// ─── KbdGroup ──────────────────────────────────────────────────────────

export type KbdGroupProps = {
  shortcutId: string;
  size?: 'sm' | 'md';
  className?: string;
};

/**
 * Render the full chord for a registered shortcut as a row of <Kbd> chips.
 * Adapts to the current platform automatically.
 * @param shortcutId - The shortcut id from `registry.ts`
 * @param size       - Size variant forwarded to each Kbd
 */
export function KbdGroup({ shortcutId, size = 'sm', className }: KbdGroupProps) {
  const platform = usePlatform();
  const def = getShortcutById(shortcutId);
  if (!def) return null;
  const segments = formatChord(def.chord, platform);
  return (
    <span className={['inline-flex items-center gap-1', className].filter(Boolean).join(' ')}>
      {segments.map((seg, i) => (
        <Kbd key={i} size={size}>
          {seg.label}
        </Kbd>
      ))}
    </span>
  );
}

// ─── ShortcutHint ──────────────────────────────────────────────────────

export type ShortcutHintProps = {
  shortcutId: string;
  /** Render as compact single label (e.g. "⌘K") instead of separated chips. */
  compact?: boolean;
  className?: string;
};

/**
 * Inline shortcut hint suitable for rendering inside buttons, dropdown items,
 * or near labels. Auto-adapts to the current platform.
 *
 * Returns `null` if the id is unknown so silent rendering failures don't
 * pollute the UI.
 *
 * @param shortcutId - The shortcut id from `registry.ts`
 * @param compact    - When true, render as a single `⌘K`-style string instead of separate chips
 */
export function ShortcutHint({ shortcutId, compact = false, className }: ShortcutHintProps): ReactNode {
  const platform = usePlatform();
  const def = getShortcutById(shortcutId);
  if (!def) return null;
  if (compact) {
    return (
      <span className={['text-[10px] tracking-wide text-muted-foreground', className].filter(Boolean).join(' ')}>
        {formatChordText(def.chord, platform)}
      </span>
    );
  }
  return <KbdGroup shortcutId={shortcutId} className={className} />;
}

// ─── Hint (chord-only, no id lookup) ───────────────────────────────────

export type HintProps = {
  chord: { mac: string; default: string };
  size?: 'sm' | 'md';
  className?: string;
};

/**
 * Render a chord directly (without a registry lookup). Useful for showing
 * chords in toasts, code blocks, or anywhere the shortcut has no formal
 * definition.
 */
export function Hint({ chord, size = 'sm', className }: HintProps) {
  const platform = usePlatform();
  const segments = formatChord(chord, platform);
  return (
    <span className={['inline-flex items-center gap-1', className].filter(Boolean).join(' ')}>
      {segments.map((seg, i) => (
        <Kbd key={i} size={size}>
          {seg.label}
        </Kbd>
      ))}
    </span>
  );
}

export { usePlatform };
// Re-export the chord helper used by callers wanting raw platform-aware chord strings
export { chordForPlatform, formatChordText };
