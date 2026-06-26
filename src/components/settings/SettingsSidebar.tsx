/**
 * Settings sidebar — searchable nav with categorized sections (Personal, Workflow, Organization).
 */
import { useState, useMemo } from 'react';
import {
  User,
  Paintbrush,
  Bell,
  Shield,
  Accessibility,
  SlidersHorizontal,
  Keyboard,
  Globe,
  Workflow,
  Coins,
  Bot,
  Folder,
  Puzzle,
  CreditCard,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { SettingSearch } from './shared/SettingSearch';
import type { LucideIcon } from 'lucide-react';

type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
};

type Category = {
  id: string;
  label: string;
  items: NavItem[];
};

const PERSONAL: Category = {
  id: 'personal',
  label: 'Personal',
  items: [
    { id: 'account', label: 'Account', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Paintbrush },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Data', icon: Shield },
    { id: 'accessibility', label: 'Accessibility', icon: Accessibility },
  ],
};

const WORKFLOW: Category = {
  id: 'workflow',
  label: 'Workflow',
  items: [
    { id: 'defaults', label: 'Defaults', icon: SlidersHorizontal },
    { id: 'keyboard', label: 'Keyboard', icon: Keyboard },
    { id: 'models', label: 'Models', icon: Globe },
    { id: 'workflows', label: 'Workflows & Triggers', icon: Workflow },
    { id: 'cost-usage', label: 'Cost & Usage', icon: Coins },
    { id: 'agents', label: 'Agents', icon: Bot },
  ],
};

const ORGANIZATION: Category = {
  id: 'organization',
  label: 'Organization',
  items: [
    { id: 'workspaces', label: 'Workspaces', icon: Folder },
    { id: 'integrations', label: 'Integrations', icon: Puzzle },
    { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
  ],
};

const ALL_CATEGORIES = [PERSONAL, WORKFLOW, ORGANIZATION];

type SettingsSidebarProps = {
  activeSection: string;
  onSectionChange: (id: string) => void;
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
    if (!query.trim()) return ALL_CATEGORIES;
    const q = query.toLowerCase();
    return ALL_CATEGORIES
      .map(cat => ({
        ...cat,
        items: cat.items.filter(item => item.label.toLowerCase().includes(q)),
      }))
      .filter(cat => cat.items.length > 0);
  }, [query]);

  return (
    <div className="flex h-full flex-col bg-sidebar border-r border-sidebar-border/40">
      <div className="flex flex-col gap-4 px-4 pt-4 pb-3">
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
                {category.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => onSectionChange(item.id)}
                      className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                        isActive
                          ? 'bg-sidebar-accent text-foreground font-medium'
                          : 'text-foreground/80 hover:bg-sidebar-accent/50 hover:text-foreground'
                      }`}
                    >
                      <Icon size={15} strokeWidth={STROKE_WIDTH} className="shrink-0" />
                      <span>{item.label}</span>
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
