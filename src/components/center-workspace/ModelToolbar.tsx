import { Settings, ChevronDown } from 'lucide-react';
import { Pill } from '@/components/ui/Pill';
import { IconButton } from '@/components/ui/IconButton';
import { models } from '@/data/models';
import { STROKE_WIDTH } from '@/lib/constants';

type ModelToolbarProps = {
  activeModel: string;
  onModelChange: (id: string) => void;
  shortcut?: string;
  onSetRun?: () => void;
};

export function ModelToolbar({
  activeModel,
  onModelChange,
  shortcut = '⌘G',
  onSetRun,
}: ModelToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b border-border bg-sidebar/50 px-4 h-11">
      <div className="flex items-center gap-2">
        <IconButton aria-label="Settings">
          <Settings size={14} strokeWidth={STROKE_WIDTH} />
        </IconButton>
        <div className="w-px h-5 bg-border" />
        {models.map((model) => (
          <Pill
            key={model.id}
            active={activeModel === model.id}
            onClick={() => onModelChange(model.id)}
          >
            <model.icon size={12} strokeWidth={STROKE_WIDTH} />
            <span>{model.label}</span>
          </Pill>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onSetRun}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-border bg-secondary text-foreground hover:bg-tertiary transition-colors"
        >
          <Settings size={12} strokeWidth={STROKE_WIDTH} />
          <span>Set Run</span>
          <kbd className="ml-1 px-1 py-0.5 text-[10px] font-mono bg-tertiary rounded">
            {shortcut}
          </kbd>
          <ChevronDown size={12} className="text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
