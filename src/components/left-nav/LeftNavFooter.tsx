import { Bell, Settings } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';

type LeftNavFooterProps = {
  notificationCount: number;
  onSettingsClick?: () => void;
  onNotificationsClick?: () => void;
};

export function LeftNavFooter({
  notificationCount,
  onSettingsClick,
  onNotificationsClick,
}: LeftNavFooterProps) {
  return (
    <div className="border-t border-sidebar-border px-2 py-2">
      <div className="flex items-center gap-1">
        <button
          onClick={onSettingsClick}
          className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
        >
          <Settings size={16} strokeWidth={STROKE_WIDTH} className="shrink-0" />
          <span className="flex-1 text-left">Settings</span>
        </button>
        <button
          onClick={onNotificationsClick}
          className="relative flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
        >
          <Bell size={16} strokeWidth={STROKE_WIDTH} className="shrink-0" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-chart-1 text-[9px] font-semibold text-highlight-foreground">
              {notificationCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
