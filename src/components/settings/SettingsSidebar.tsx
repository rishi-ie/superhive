import {
  User,
  Paintbrush,
  Bell,
  Sparkles,
  Keyboard,
  GitBranch,
  Bot,
  Terminal,
  Link,
  Globe,
  Building2,
  Users,
  Folder,
  Monitor,
  Puzzle,
  Search,
  ArrowLeft,
  ArrowRight,
  History,
  ExternalLink,
} from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { MaximizeOnDoubleClick } from '@/components/ui/MaximizeOnDoubleClick';
import { STROKE_WIDTH } from '@/lib/constants';
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
  ],
};

const EDITOR_WORKFLOW: Category = {
  id: 'editor-workflow',
  label: 'Editor & Workflow',
  items: [
    { id: 'general', label: 'General', icon: Sparkles },
    { id: 'keyboard', label: 'Keyboard', icon: Keyboard },
    { id: 'git', label: 'Git & Worktrees', icon: GitBranch },
    { id: 'agents', label: 'Agents', icon: Bot },
    { id: 'terminal', label: 'Terminal', icon: Terminal },
    { id: 'links', label: 'Links', icon: Link },
    { id: 'models', label: 'Models', icon: Globe },
  ],
};

const ORGANIZATION: Category = {
  id: 'organization',
  label: 'Organization',
  items: [
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'teams', label: 'Teams', icon: Users },
    { id: 'projects', label: 'Projects', icon: Folder },
    { id: 'hosts', label: 'Hosts', icon: Monitor },
    { id: 'integrations', label: 'Integrations', icon: Puzzle },
  ],
};

const ALL_CATEGORIES = [PERSONAL, EDITOR_WORKFLOW, ORGANIZATION];

type SettingsSidebarProps = {
  activeSection: string;
  onSectionChange: (id: string) => void;
  onBack: () => void;
};

export function SettingsSidebar({ activeSection, onSectionChange, onBack }: SettingsSidebarProps) {
  return (
    <div className="flex h-full flex-col bg-sidebar border-r border-sidebar-border/40">
      <div className="drag flex h-10 shrink-0 items-center gap-1 pl-20 pr-3">
        <IconButton aria-label="Back in history" disabled>
          <ArrowLeft size={16} strokeWidth={STROKE_WIDTH} />
        </IconButton>
        <IconButton aria-label="Forward in history" disabled>
          <ArrowRight size={16} strokeWidth={STROKE_WIDTH} />
        </IconButton>
        <IconButton aria-label="History" disabled>
          <History size={16} strokeWidth={STROKE_WIDTH} />
        </IconButton>
        <div className="flex-1" />
      </div>

      <div className="flex flex-col gap-4 px-4 pt-1 pb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors text-left"
        >
          <ArrowLeft size={12} strokeWidth={STROKE_WIDTH} />
          Back
        </button>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" strokeWidth={STROKE_WIDTH} />
          <input
            type="text"
            placeholder="Search settings..."
            className="w-full rounded-md border border-border bg-input py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {ALL_CATEGORIES.map((category) => (
          <div key={category.id} className="mt-4">
            <span className="mb-2 block px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {category.label}
            </span>
            <div className="flex flex-col gap-0.5">
              {category.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSectionChange(item.id)}
                    className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-sidebar-accent text-foreground border-l-2 border-chart-1'
                        : 'text-foreground hover:bg-sidebar-accent/50'
                    }`}
                  >
                    <Icon size={15} strokeWidth={STROKE_WIDTH} className="shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
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
