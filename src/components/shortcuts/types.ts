/**
 * Type re-exports for shortcut components.
 * Keep this file lean — it's only for type plumbing.
 */
import type { Chord } from '@/lib/shortcuts/chord';
import type { ShortcutCategory } from '@/lib/shortcuts/registry';

export type { Chord } from '@/lib/shortcuts/chord';
export type { ShortcutCategory } from '@/lib/shortcuts/registry';

export type HintProps = {
  chord: Chord;
  size?: 'sm' | 'md';
  className?: string;
};

export type KbdGroupProps = {
  shortcutId: string;
  size?: 'sm' | 'md';
  className?: string;
};

export type ShortcutHintProps = {
  shortcutId: string;
  compact?: boolean;
  className?: string;
};

export type ShortcutRowProps = {
  shortcutId: string;
  icon?: import('lucide-react').LucideIcon;
};

export type CategoryGroupProps = {
  category: ShortcutCategory;
  title?: string;
  icon?: import('lucide-react').LucideIcon;
  children: React.ReactNode;
};
