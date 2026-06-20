import { AtSign, ClipboardCheck, Info, RefreshCw } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import type { Notification } from '@/data/mock/notifications';

type InboxPanelProps = {
  notifications: Notification[];
};

const iconMap = {
  mention: AtSign,
  task: ClipboardCheck,
  system: Info,
  update: RefreshCw,
};

export function InboxPanel({ notifications }: InboxPanelProps) {
  return (
    <div className="p-3 space-y-1">
      {notifications.map((notification) => {
        const Icon = iconMap[notification.type];
        return (
          <button
            key={notification.id}
            className={`flex w-full items-start gap-2.5 px-2 py-2 rounded-md hover:bg-sidebar-accent/50 transition-colors text-left ${
              !notification.read ? 'bg-sidebar-accent/30' : ''
            }`}
          >
            <Icon
              size={14}
              strokeWidth={STROKE_WIDTH}
              className={`shrink-0 mt-0.5 ${
                notification.type === 'mention'
                  ? 'text-chart-1'
                  : notification.type === 'task'
                  ? 'text-chart-2'
                  : 'text-muted-foreground'
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className={`text-xs ${!notification.read ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {notification.title}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                {notification.description}
              </div>
              <div className="text-[10px] text-muted-foreground/60 mt-1">
                {notification.time}
              </div>
            </div>
            {!notification.read && (
              <div className="size-1.5 rounded-full bg-chart-1 shrink-0 mt-1.5" />
            )}
          </button>
        );
      })}
    </div>
  );
}
