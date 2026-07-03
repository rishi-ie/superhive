/**
 * Keyboard shortcut module barrel.
 */
export {
  detectPlatform,
  usePlatform,
  type Platform,
} from './platform';

export type { Chord } from './chord';
export {
  normalizeChord,
  chordForPlatform,
} from './chord';

export { formatChord, formatChordText, type ChordSegment } from './format';

export {
  DEFAULT_SHORTCUTS,
  CATEGORY_ORDER,
  getShortcutById,
  type ShortcutDef,
  type ShortcutScope,
  type ShortcutCategory,
} from './registry';
