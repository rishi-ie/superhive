/**
 * Settings sidebar — searchable nav with categorized sections (Personal, Workflow, Organization).
 * Nav data derived from the settings registry — single source of truth.
 */
import { useState, useMemo } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { SettingSearch } from './shared/SettingSearch';
import { ComingSoonBadge } from './shared/ComingSoonBadge';
import { ShortcutHint } from '@/components/shortcuts';
import { settingsCategories, settingsRegistry, type SettingsSectionId } from '@/data/config/settings-registry';

type SettingsSidebarProps = {
  activeSection: string;
  onSectionChange: (id: SettingsSectionId) => void;
  onBack: () => void;
};

/**
 * Settings sidebar — searchable nav with categorized sections (Personal, Workflow, Organization).
 * @param activeSection - Currently active section ID
 * @param onSectionChange - Callback when a new section is selected
 * @param onBack - Callback to return to the main Dashboard
 */
export function SettingsSidebar({ activeSection, onSectionChange, onBack }: SettingsSidebarProps) {
  const [query, setQuery] = useState('');

  const filteredCategories = useMemo(() => {
    if (!query.trim()) return settingsCategories;
    const q = query.toLowerCase();
    return settingsCategories
      .map(cat => ({
        ...cat,
        sections: cat.sections.filter(sectionId => {
          const entry = settingsRegistry[sectionId];
          return entry.label.toLowerCase().includes(q);
        }),
      }))
      .filter(cat => cat.sections.length > 0);
  }, [query]);

  return (
    <div className="flex h-full flex-col bg-sidebar border-r border-sidebar-border/40">
      <div className="flex flex-col gap-4 px-4 pt-[calc(1rem+var(--titlebar-y,0px))] pb-3 [-webkit-app-region:drag] [&_button]:[-webkit-app-region:no-drag] [&_input]:[-webkit-app-region:no-drag] [&_a]:[-webkit-app-region:no-drag]">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors text-left w-fit -ml-0.5"
        >
          <ArrowLeft size={12} strokeWidth={STROKE_WIDTH} />
          Back to Superhive
        </button>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <SettingSearch onFilter={setQuery} />
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4" aria-label="Settings navigation">
        {filteredCategories.length === 0 ? (
          <p className="px-3 py-4 text-xs text-muted-foreground">No settings found.</p>
        ) : (
          filteredCategories.map((category) => (
            <div key={category.id} className="mt-3 first:mt-0">
              <span className="mb-1.5 block px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {category.label}
              </span>
              <div className="flex flex-col gap-0.5">
                {category.sections.map((sectionId) => {
                  const entry = settingsRegistry[sectionId];
                  if (!entry) return null;
                  const Icon = entry.icon;
                  const isActive = activeSection === sectionId;
                  return entry.comingSoon ? (
                    <div
                      key={sectionId}
                      className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground/50 cursor-default"
                    >
                      <Icon size={15} strokeWidth={STROKE_WIDTH} className="shrink-0" />
                      <span>{entry.label}</span>
                      <ComingSoonBadge className="ml-auto" />
                    </div>
                  ) : (
                    <button
                      key={sectionId}
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => onSectionChange(sectionId)}
                      className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                        isActive
                          ? 'bg-sidebar-accent text-foreground font-medium'
                          : 'text-foreground/80 hover:bg-sidebar-accent/50 hover:text-foreground'
                      }`}
                    >
                      <Icon size={15} strokeWidth={STROKE_WIDTH} className="shrink-0" />
                      <span>{entry.label}</span>
                      {sectionId === 'keyboard' && (
                        <ShortcutHint shortcutId="shortcuts.open" compact className="ml-auto text-[10px]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border px-4 py-3">
        <a
          href="#"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Documentation
          <ExternalLink size={11} strokeWidth={STROKE_WIDTH} />
        </a>
      </div>
    </div>
  );
}
