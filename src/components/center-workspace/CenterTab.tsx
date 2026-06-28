/**
 * Individual tab pill with icon, label, and close button.
 */
import {
  MessageSquare, Layers, ClipboardCheck, FolderOpen,
  MessageCircle, Bot, Users, Settings, Lock, X, Home,
} from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { IconButton } from '@/components/ui/IconButton';
import type { CenterTab as CenterTabType, CenterTabType as TabType } from '@/data/tabs/interface';

const TAB_ICONS: Record<TabType, typeof MessageSquare> = {
  home: Home,
  projects: Layers,
  tickets: ClipboardCheck,
  project: FolderOpen,
  channels: MessageCircle,
  channel: MessageCircle,
  agents: Users,
  agent: Bot,
  'universal-agents': Users,
  'universal-projects': FolderOpen,
  'universal-channels': MessageSquare,
  settings: Settings,
};

const TYPE_LABELS: Record<TabType, string> = {
  home: 'Home',
  projects: 'Projects',
  tickets: 'Tickets',
  project: 'Project',
  channels: 'Comms',
  channel: 'Channel',
  agents: 'Agents',
  agent: 'Agent',
  'universal-agents': 'Agents',
  'universal-projects': 'Projects',
  'universal-channels': 'Channels',
  settings: 'Settings',
};

type CenterTabProps = {
  tab: CenterTabType;
  workspaceName: string;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
};

/**
 * @param tab - Tab data to render
 * @param workspaceName - Workspace display name
 * @param isActive - Whether this tab is active
 * @param onClick - Called when tab is clicked
 * @param onClose - Called when close button is clicked
 */
export function CenterTab({ tab, workspaceName, isActive, onClick, onClose }: CenterTabProps) {
  const Icon = TAB_ICONS[tab.type];
  const typeLabel = TYPE_LABELS[tab.type];
  const isUniversal = tab.type === 'universal-agents' || tab.type === 'universal-projects' || tab.type === 'universal-channels';

  const label = tab.title
    ? tab.subtitle
      ? `${tab.title} · ${tab.subtitle}`
      : tab.title
    : (isUniversal || tab.type === 'home') ? typeLabel : `${typeLabel} · ${workspaceName}`;

  return (
    <button
      onClick={onClick}
      onContextMenu={(e) => { e.preventDefault(); }}
      className={`group relative flex items-center gap-2 h-9 px-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
        isActive
          ? 'border-chart-1 text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
      title={label}
    >
      {tab.pinned && (
        <Lock size={10} strokeWidth={STROKE_WIDTH} className="text-muted-foreground/60 shrink-0" />
      )}
      <Icon size={14} strokeWidth={STROKE_WIDTH} className="shrink-0" />
      <span className="truncate max-w-[180px]">{label}</span>
      {tab.modified && (
        <span className="size-1.5 rounded-full bg-chart-1 shrink-0" />
      )}
      {tab.pinned ? null : (
        <IconButton
          variant="ghost"
          size="sm"
          aria-label="Close tab"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="opacity-0 group-hover:opacity-100 hover:bg-accent rounded p-0.5 transition-opacity ml-auto shrink-0"
        >
          <X size={12} strokeWidth={STROKE_WIDTH} />
        </IconButton>
      )}
    </button>
  );
}
