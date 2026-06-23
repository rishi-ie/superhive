import { Avatar } from '@/components/ui/Avatar';
import { STROKE_WIDTH } from '@/lib/constants';
import type { ChatThread } from '@/data/chat/store';

type ChatThreadProps = {
  thread: ChatThread;
};

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

export function ChatThread({ thread }: ChatThreadProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {thread.messages.map((message) => {
        const isUser = message.role === 'user';
        return (
          <div
            key={message.id}
            className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {!isUser && (
              <Avatar
                size="sm"
                fallback="SC"
                className="shrink-0"
              />
            )}
            <div
              className={`flex flex-col gap-1 max-w-[70%] ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`px-3 py-2 rounded-2xl text-sm ${
                  isUser
                    ? 'bg-chart-1 text-highlight-foreground rounded-tr-md'
                    : 'bg-card border border-border text-foreground rounded-tl-md'
                }`}
              >
                {message.content}
              </div>
              <span className="text-[10px] text-muted-foreground px-1 font-fustat">
                {formatTime(message.timestamp)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
