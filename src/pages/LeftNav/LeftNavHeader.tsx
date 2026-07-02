/**
 * Left nav header — navigation controls and panel toggles.
 */
import { PanelLeftClose, ArrowLeft, ArrowRight, Columns2 } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { MaximizeOnDoubleClick } from '@/components/ui/MaximizeOnDoubleClick';
import { STROKE_WIDTH } from '@/lib/constants';

type LeftNavHeaderProps = {
  onToggleLeft?: () => void;
  onToggleRight?: () => void;
};

/**
 * Left nav header — navigation controls and panel toggles.
 * @param onToggleLeft - Called to collapse/expand left panel
 * @param onToggleRight - Called to collapse/expand right panel
 */
export function LeftNavHeader({ onToggleLeft, onToggleRight }: LeftNavHeaderProps) {
  return (
    <MaximizeOnDoubleClick className="drag flex items-center gap-1 pl-20 pr-3 h-9 shrink-0">
      <IconButton aria-label="Toggle sidebar" onClick={onToggleLeft}>
        <PanelLeftClose size={16} strokeWidth={STROKE_WIDTH} />
      </IconButton>
      <IconButton aria-label="Back" disabled>
        <ArrowLeft size={16} strokeWidth={STROKE_WIDTH} />
      </IconButton>
      <IconButton aria-label="Forward" disabled>
        <ArrowRight size={16} strokeWidth={STROKE_WIDTH} />
      </IconButton>
      <div className="flex-1" />
      <IconButton aria-label="Toggle right panel" onClick={onToggleRight}>
        <Columns2 size={16} strokeWidth={STROKE_WIDTH} />
      </IconButton>
    </MaximizeOnDoubleClick>
  );
}
