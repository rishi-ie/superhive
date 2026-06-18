import { Bell } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';

type LeftNavFooterProps = {
  brandName: string;
  brandIconLetter: string;
  notificationCount: number;
};

export function LeftNavFooter({
  brandName,
  brandIconLetter,
  notificationCount,
}: LeftNavFooterProps) {
  return (
    <div className="border-t border-sidebar-border px-3 py-2">
      <button className="no-drag flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors">
        <div className="size-5 shrink-0 rounded bg-gradient-to-br from-chart-1 to-chart-2 flex items-center justify-center">
          <span className="text-[8px] font-bold text-white">{brandIconLetter}</span>
        </div>
        <span className="flex-1 text-left">{brandName}</span>
        <span className="flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-chart-1 text-[10px] font-semibold text-highlight-foreground">
          {notificationCount}
        </span>
        <Bell size={14} strokeWidth={STROKE_WIDTH} className="text-muted-foreground" />
      </button>
    </div>
  );
}
