/**
 * Keyboard settings page — searchable, category-filtered documentation
 * of every keyboard shortcut defined in the app.
 *
 * The shortcuts themselves are **developer-set** in
 * `src/lib/shortcuts/registry.ts` — this page does not allow rebinding.
 * It is purely a reference surface.
 */
import { useMemo, useState } from 'react';
import { Search, Code2 } from 'lucide-react';
import { SettingsPageHeader } from './shared/SettingsPageHeader';
import { ShortcutRow, CategoryGroup, CATEGORY_ICONS } from '@/components/shortcuts';
import {
  DEFAULT_SHORTCUTS,
  CATEGORY_ORDER,
  type ShortcutCategory,
} from '@/lib/shortcuts/registry';
import { cn } from '@/lib/utils';
import { STROKE_WIDTH } from '@/lib/constants';

/**
 * Keyboard shortcuts settings — shows every developer-defined shortcut grouped
 * by category, with text search and chip-based category filtering.
 */
export function KeyboardSettings() {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ShortcutCategory | 'all'>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DEFAULT_SHORTCUTS.filter(s => {
      if (activeFilter !== 'all' && s.category !== activeFilter) return false;
      if (!q) return true;
      return (
        s.label.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    });
  }, [query, activeFilter]);

  // Counts per category for the chips
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const s of DEFAULT_SHORTCUTS) c[s.category] = (c[s.category] ?? 0) + 1;
    return c;
  }, []);

  const visibleCategories = useMemo(() => {
    if (activeFilter !== 'all') return [activeFilter];
    return CATEGORY_ORDER.filter(c => filtered.some(s => s.category === c));
  }, [filtered, activeFilter]);

  return (
    <div className="flex flex-col gap-8">
      <SettingsPageHeader
        title="Keyboard shortcuts"
        description="Quick reference for every shortcut in Superhive."
      />

      {/* Info card pointing at the registry file */}
      <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-3.5">
        <Code2 size={16} strokeWidth={STROKE_WIDTH} className="mt-0.5 shrink-0 text-muted-foreground" />
        <div className="text-[11px] leading-relaxed text-muted-foreground">
          Shortcuts are <span className="text-foreground/90 font-medium">developer-defined</span> and live in a single registry:{' '}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10.5px] text-foreground/90">src/lib/shortcuts/registry.ts</code>.
          Add, change, or remove a shortcut there — the rest of the app re-renders automatically.
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} strokeWidth={STROKE_WIDTH} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search shortcuts…"
          className="w-full rounded-md border border-border/60 bg-card px-9 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-1.5">
        <FilterChip
          active={activeFilter === 'all'}
          onClick={() => setActiveFilter('all')}
          label="All"
          count={DEFAULT_SHORTCUTS.length}
        />
        {CATEGORY_ORDER.filter(c => (counts[c] ?? 0) > 0).map(cat => {
          const meta = CATEGORY_ICONS[cat];
          const Icon = meta.icon;
          return (
            <FilterChip
              key={cat}
              active={activeFilter === cat}
              onClick={() => setActiveFilter(cat)}
              label={meta.label}
              count={counts[cat] ?? 0}
              icon={<Icon size={11} strokeWidth={STROKE_WIDTH} />}
            />
          );
        })}
      </div>

      {/* Shortcuts grouped by category */}
      <div className="flex flex-col gap-8">
        {visibleCategories.map(cat => {
          const items = filtered.filter(s => s.category === cat);
          if (items.length === 0) return null;
          return (
            <CategoryGroup key={cat} category={cat}>
              {items.map(s => (
                <ShortcutRow key={s.id} shortcutId={s.id} />
              ))}
            </CategoryGroup>
          );
        })}
        {visibleCategories.length === 0 && (
          <div className="py-12 text-center text-xs text-muted-foreground">
            No shortcuts match your search.
          </div>
        )}
      </div>

      <div className="pt-2 text-[10px] text-muted-foreground">
        Showing {filtered.length} of {DEFAULT_SHORTCUTS.length} shortcuts.
      </div>
    </div>
  );
}

// ─── Filter chip ──────────────────────────────────────────────────────

type FilterChipProps = {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  icon?: React.ReactNode;
};

function FilterChip({ active, onClick, label, count, icon }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors',
        active
          ? 'border-accent bg-accent/10 text-foreground'
          : 'border-border/60 bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40',
      )}
    >
      {icon}
      <span>{label}</span>
      <span className={cn('rounded-full px-1.5 text-[9.5px] tabular-nums', active ? 'bg-accent/20 text-foreground/90' : 'bg-muted/60 text-muted-foreground')}>
        {count}
      </span>
    </button>
  );
}
