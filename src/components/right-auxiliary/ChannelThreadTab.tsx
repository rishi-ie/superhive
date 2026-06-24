import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Send } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { addChannelMessage } from '@/data/projects/store';
import type { ChannelMessage, ProjectAgent } from '@/data/projects/store';

type ChannelThreadTabProps = {
  channelId: string;
  messages: ChannelMessage[];
  agents: ProjectAgent[];
  onSend?: (content: string) => void;
  onParticipantClick?: (agentId: string) => void;
};

export function ChannelThreadTab({
  channelId,
  messages,
  agents,
  onSend,
  onParticipantClick,
}: ChannelThreadTabProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    addChannelMessage(channelId, 'User', input.trim(), false);
    onSend?.(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground/60 italic text-center py-4">No messages yet.</p>
        )}
        {messages.map(msg => {
          const agent = agents.find(a => a.name === msg.senderName);
          const initials = agent?.initials ?? msg.senderName.slice(0, 2).toUpperCase();
          return (
            <div key={msg.id} className="flex items-start gap-2">
              <button
                onClick={() => {
                  if (agent && onParticipantClick) onParticipantClick(agent.id);
                }}
                className="shrink-0"
                type="button"
              >
                <Avatar size="xs" fallback={initials} />
              </button>
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      if (agent && onParticipantClick) onParticipantClick(agent.id);
                    }}
                    className="text-[10px] font-semibold text-foreground hover:text-chart-1 transition-colors"
                    type="button"
                  >
                    {msg.senderName}
                  </button>
                  <span className="text-[9px] text-muted-foreground/60 font-fustat">{msg.timestamp}</span>
                  {msg.isAI && (
                    <span className="text-[8px] font-medium uppercase tracking-wider rounded border border-chart-2/40 bg-chart-2/10 text-chart-2 px-1 py-0.5">AI</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{msg.content}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="shrink-0 border-t border-border p-2">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            rows={2}
            className="flex-1 resize-none rounded-md border border-border bg-input px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            onClick={handleSend}
            type="button"
            disabled={!input.trim()}
            className="shrink-0 size-8 rounded-md bg-chart-1 flex items-center justify-center text-highlight-foreground hover:bg-chart-1/90 transition-colors disabled:opacity-40"
          >
            <Send size={14} strokeWidth={STROKE_WIDTH} />
          </button>
        </div>
      </div>
    </div>
  );
}
