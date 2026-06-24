import {
  MessageSquare, Layers, ClipboardCheck, FolderOpen,
  MessageCircle, Bot, Users, Settings, Lock, X, Star,
} from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import type { CenterTab as CenterTabType, CenterTabType as TabType } from '@/data/tabs/interface';

const TAB_ICONS: Record<TabType, typeof MessageSquare> = {
  projects: Layers,
  tickets: ClipboardCheck,
  ticket: ClipboardCheck,
  project: FolderOpen,
  channels: MessageCircle,
  channel: MessageCircle,
  agents: Users,
  agent: Bot,
  'universal-agents': Users,
  'universal-projects': FolderOpen,
  settings: Settings,
};

const TYPE_LABELS: Record<TabType, string> = {
  projects: 'Projects',
  tickets: 'Tickets',
  ticket: 'Ticket',
  project: 'Project',
  channels: 'Comms',
  channel: 'Channel',
  agents: 'Agents',
  agent: 'Agent',
  'universal-agents': 'Agents',
  'universal-projects': 'Projects',
  settings: 'Settings',
};

type CenterTabProps = {
  tab: CenterTabType;
  workspaceName: string;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
};

export function CenterTab({ tab, workspaceName, isActive, onClick, onClose }: CenterTabProps) {
  const Icon = TAB_ICONS[tab.type];
  const typeLabel = TYPE_LABELS[tab.type];
  const isUniversal = tab.type === 'universal-agents' || tab.type === 'universal-projects';

  const label = tab.title
    ? tab.subtitle
      ? `${tab.title} · ${tab.subtitle}`
      : tab.title
    : isUniversal
    ? typeLabel
    : `${typeLabel} · ${workspaceName}`;

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
        <span
          role="button"
          aria-label="Close tab"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="opacity-0 group-hover:opacity-100 hover:bg-accent rounded p-0.5 transition-opacity ml-auto shrink-0"
        >
          <X size={12} strokeWidth={STROKE_WIDTH} />
        </span>
      )}
    </button>
  );
}
