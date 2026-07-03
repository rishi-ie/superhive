/**
 * Barrel for the shortcut UI primitives.
 * Use these to surface keyboard shortcut hints anywhere in the app — they
 * auto-adapt to the current platform and read from the registry.
 */
export { Hint, KbdGroup, ShortcutHint, CATEGORY_ICONS, usePlatform, formatChordText } from './Hint';
export { ShortcutRow } from './ShortcutRow';
export { CategoryGroup } from './CategoryGroup';
export type { HintProps, KbdGroupProps, ShortcutHintProps, ShortcutRowProps, CategoryGroupProps } from './types';
