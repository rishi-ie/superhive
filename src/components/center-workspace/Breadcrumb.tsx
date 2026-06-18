import { ChevronRight, GitBranch, ChevronDown, Columns2 } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { MaximizeOnDoubleClick } from '@/components/ui/MaximizeOnDoubleClick';
import { STROKE_WIDTH } from '@/lib/constants';

type BreadcrumbProps = {
  segments: string[];
  branchName: string;
  onSplitView?: () => void;
};

export function Breadcrumb({ segments, branchName, onSplitView }: BreadcrumbProps) {
  return (
    <MaximizeOnDoubleClick className="flex items-center justify-between border-b border-border px-4 h-9">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {segments.map((segment, i) => {
          const isLast = i === segments.length - 1;
          return (
            <span key={i} className="flex items-center gap-1.5">
              <span
                className={`hover:text-foreground cursor-pointer transition-colors ${
                  isLast ? 'text-foreground font-medium' : ''
                }`}
              >
                {segment}
              </span>
              {!isLast && <ChevronRight size={12} className="text-muted-foreground/60" />}
            </span>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-secondary text-foreground hover:bg-tertiary transition-colors">
          <GitBranch size={12} strokeWidth={STROKE_WIDTH} />
          <span>/{branchName}</span>
          <ChevronDown size={12} className="text-muted-foreground" />
        </button>
        <IconButton onClick={onSplitView} aria-label="Toggle split view">
          <Columns2 size={16} strokeWidth={STROKE_WIDTH} />
        </IconButton>
      </div>
    </MaximizeOnDoubleClick>
  );
}
