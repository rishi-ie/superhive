/**
 * CategoryGroup — titled section grouping shortcuts in the Keyboard settings page.
 */
import type { ReactNode } from 'react';
import { CATEGORY_ICONS } from '@/components/shortcuts/Hint';
import type { ShortcutCategory } from '@/lib/shortcuts/registry';

export type CategoryGroupProps = {
  category: ShortcutCategory;
  /** Optional override for the section title. */
  title?: string;
  /** Optional replace for the icon. */
  icon?: typeof CATEGORY_ICONS['global']['icon'];
  children: ReactNode;
};

/**
 * Titled section grouping related shortcuts (icon + heading + list of rows).
 * Children are typically `<ShortcutRow />` instances.
 * @param category - Shortcut category, drives default label + icon
 * @param title    - Override the title text
 * @param icon     - Override the icon
 */
export function CategoryGroup({ category, title, icon, children }: CategoryGroupProps) {
  const meta = CATEGORY_ICONS[category];
  const Icon = icon ?? meta.icon;
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Icon size={14} strokeWidth={1.5} className="text-muted-foreground" />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title ?? meta.label}
        </h3>
      </div>
      <div className="divide-y divide-border/40 border-t border-border/40">
        {children}
      </div>
    </section>
  );
}
