/**
 * ShortcutRow — a single entry in the Keyboard settings page.
 * Renders label, description, and the platform-appropriate chord.
 */
import { usePlatform } from '@/lib/shortcuts/platform';
import { getShortcutById } from '@/lib/shortcuts/registry';
import { KbdGroup } from './Hint';
import { CATEGORY_ICONS } from './Hint';
import type { LucideIcon } from 'lucide-react';

export type ShortcutRowProps = {
  shortcutId: string;
  icon?: LucideIcon;
};

/**
 * Renders a single shortcut as a settings-row (icon + label/desc + chord).
 * Used inside a CategoryGroup section on the Keyboard settings page.
 * @param shortcutId - Shortcut id from the registry
 * @param icon       - Optional category icon shown on the left
 */
export function ShortcutRow({ shortcutId, icon }: ShortcutRowProps) {
  usePlatform(); // ensures re-render on platform change (rare)
  const def = getShortcutById(shortcutId);
  if (!def) return null;
  const Icon = icon ?? CATEGORY_ICONS[def.category].icon;

  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="flex items-center gap-3 min-w-0">
        <Icon size={14} strokeWidth={1.5} className="shrink-0 text-muted-foreground" />
        <div className="flex flex-col min-w-0">
          <span className="text-xs text-foreground leading-snug">{def.label}</span>
          <span className="text-[10px] text-muted-foreground leading-snug truncate">
            {def.description}
          </span>
        </div>
      </div>
      <KbdGroup shortcutId={shortcutId} size="sm" />
    </div>
  );
}
