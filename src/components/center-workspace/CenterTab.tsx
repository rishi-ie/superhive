import { MessageSquare, Layers, ClipboardCheck, FolderOpen, MessageCircle, X } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import type { CenterTab as CenterTabType, CenterTabType as TabType } from '@/data/tabs/interface';

const TAB_ICONS: Record<TabType, typeof MessageSquare> = {
  chat: MessageSquare,
  projects: Layers,
  tickets: ClipboardCheck,
  project: FolderOpen,
  channel: MessageCircle,
};

const TAB_LABELS: Record<TabType, string> = {
  chat: 'Chat',
  projects: 'Projects',
  tickets: 'Tickets',
  project: 'Project',
  channel: 'Channel',
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
  const label = `${TAB_LABELS[tab.type]} · ${workspaceName}`;

  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-2 h-9 px-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
        isActive
          ? 'border-chart-1 text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      <Icon size={14} strokeWidth={STROKE_WIDTH} />
      <span>{label}</span>
      <span
        role="button"
        aria-label="Close tab"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="opacity-0 group-hover:opacity-100 hover:bg-accent rounded p-0.5 transition-opacity"
      >
        <X size={12} strokeWidth={STROKE_WIDTH} />
      </span>
    </button>
  );
}
