/**
 * Keyboard shortcut module barrel.
 */
export {
  detectPlatform,
  usePlatform,
  isMac,
  isWindows,
  isLinux,
  type Platform,
} from './platform';

export type { Chord } from './chord';
export {
  normalizeChord,
  chordForPlatform,
  matchesEvent,
  eventToChord,
  isInputTarget,
  isDialogOpen,
} from './chord';

export { formatChord, formatChordText, type ChordSegment } from './format';

export {
  DEFAULT_SHORTCUTS,
  CATEGORY_ORDER,
  getShortcutById,
  getShortcutsByCategory,
  validateRegistry,
  runRegistryValidation,
  type ShortcutDef,
  type ShortcutScope,
  type ShortcutCategory,
} from './registry';

export { ACTIONS } from './actions';
export { useGlobalShortcuts, getActionFor, matchShortcutForTest, type ShortcutAPI, type ShortcutOptions } from './useGlobalShortcuts';
