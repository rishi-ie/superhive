import { useState } from 'react';
import { ChevronRight, ChevronDown, Columns2, X, MessageSquare } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { STROKE_WIDTH } from '@/lib/constants';

type NewChatAccordionProps = {
  title: string;
  defaultExpanded?: boolean;
  onSplit?: () => void;
  onClose?: () => void;
  children?: React.ReactNode;
};

export function NewChatAccordion({
  title,
  defaultExpanded = true,
  onSplit,
  onClose,
  children,
}: NewChatAccordionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="border-b border-border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="no-drag flex items-center justify-between w-full px-4 h-9 hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown size={14} className="text-muted-foreground" />
          ) : (
            <ChevronRight size={14} className="text-muted-foreground" />
          )}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <IconButton size="xs" onClick={onSplit} aria-label="Split">
            <Columns2 size={12} strokeWidth={STROKE_WIDTH} />
          </IconButton>
          <IconButton size="xs" onClick={onClose} aria-label="Close">
            <X size={12} strokeWidth={STROKE_WIDTH} />
          </IconButton>
        </div>
      </button>
      {expanded && children}
    </div>
  );
}

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
};

export function ChatEmptyState({ icon, title }: EmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center justify-center size-16 rounded-full bg-secondary">
          {icon ?? (
            <MessageSquare size={28} className="text-muted-foreground" strokeWidth={STROKE_WIDTH} />
          )}
        </div>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    </div>
  );
}
