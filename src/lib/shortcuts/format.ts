/**
 * Platform-aware chord formatter.
 *
 * Given a chord string like "Mod+k", returns the OS-appropriate labels:
 * - Mac:    "⌘ K"
 * - Windows/Linux: "Ctrl + K"
 *
 * Each segment is split (modifiers + main key) so consumers can render them
 * as separate <Kbd/> chips for proper visual hierarchy.
 */
import { chordForPlatform, normalizeChord } from './chord';
import type { Chord } from './chord';
import type { Platform } from './platform';

export type ChordSegment = {
  label: string;
  isMod: boolean;
};

const MAC_SYMBOLS = {
  Mod: '⌘',
  Cmd: '⌘',
  Shift: '⇧',
  Alt: '⌥',
  Enter: '↵',
  Escape: '⎋',
  Backspace: '⌫',
  Tab: 'Tab',
  CapsLock: '⇪',
} as const;

const WIN_SYMBOLS = {
  Mod: 'Ctrl',
  Cmd: 'Win',
  Shift: 'Shift',
  Alt: 'Alt',
  Enter: 'Enter',
  Escape: 'Esc',
  Backspace: 'Backspace',
  Tab: 'Tab',
  CapsLock: 'Caps',
} as const;

/**
 * Render a chord as an array of segments, each containing a label (already
 * platform-appropriate) and an `isMod` flag for styling.
 */
export function formatChord(chord: Chord | string, platform: Platform = 'unknown'): ChordSegment[] {
  const isChordType = typeof chord !== 'string';
  const raw = isChordType ? chordForPlatform(chord, platform) : chord;
  const normalized = normalizeChord(raw);
  const parts = normalized.split('+');
  const isMacOs = platform === 'mac';

  return parts.map(part => {
    const isMod = part === 'Mod' || part === 'Shift' || part === 'Alt' || part === 'Meta';
    if (isMacOs && part in MAC_SYMBOLS) {
      return { label: MAC_SYMBOLS[part as keyof typeof MAC_SYMBOLS], isMod };
    }
    if (!isMacOs && part in WIN_SYMBOLS) {
      return { label: WIN_SYMBOLS[part as keyof typeof WIN_SYMBOLS], isMod };
    }
    // Main key — uppercase single letters for display
    return { label: part.length === 1 ? part.toUpperCase() : part, isMod: false };
  });
}

/**
 * Render a chord as a plain text string suitable for tooltips or compact UIs.
 * Examples:
 *   "Mod+k"     on Mac    → "⌘K"
 *   "Mod+k"     on Win    → "Ctrl + K"
 *   "Escape"    on Mac    → "Esc"
 */
export function formatChordText(chord: Chord | string, platform: Platform = 'unknown'): string {
  const segments = formatChord(chord, platform);
  const separator = platform === 'mac' ? '' : ' + ';
  return segments.map(s => s.label).join(separator);
}
