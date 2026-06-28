/**
 * Single channel detail with message thread and compose input.
 */
import { useState, useRef, useEffect } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Textarea } from '@/components/ui/Textarea';
import { Send, Paperclip } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { ChannelStatusPill } from '@/components/channels';
import { listChannelMessages, addChannelMessage, listProjectAgents, getChannel } from '@/data/projects/store';
import { listWorkspaces } from '@/data/workspaces/store';
import type { ChannelMessage } from '@/data/projects/store';

type ChannelDetailViewProps = {
  channelId: string;
  workspaceId: string;
  onParticipantClick?: (agentId: string) => void;
  onTicketClick?: (ticketId: string) => void;
  onAgentSelect?: (agentId: string) => void;
};

function ChannelMessageItem({ msg, agentMap, onParticipantClick }: {
  msg: ChannelMessage;
  agentMap: Record<string, { initials: string; id: string }>;
  onParticipantClick?: (agentId: string) => void;
}) {
  const agent = Object.values(agentMap).find(a => a.initials === msg.senderName.slice(0, 2).toUpperCase());
  const initials = agent?.initials ?? msg.senderName.slice(0, 2).toUpperCase();
  const agentId = agent?.id;

  return (
    <div className="flex items-start gap-3 py-2">
      <button
        onClick={() => agentId && onParticipantClick?.(agentId)}
        className="shrink-0"
        type="button"
      >
        <Avatar size="xs" fallback={initials} />
      </button>
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => agentId && onParticipantClick?.(agentId)}
            className="text-[11px] font-semibold text-foreground hover:text-chart-1 transition-colors p-0 h-auto"
          >
            {msg.senderName}
          </Button>
          <span className="text-[9px] text-muted-foreground/60 font-fustat">{msg.timestamp}</span>
          {msg.isAI && (
            <span className="text-[8px] font-medium uppercase tracking-wider rounded border border-chart-2/40 bg-chart-2/10 text-chart-2 px-1 py-0.5">AI</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{msg.content}</p>
      </div>
    </div>
  );
}

/**
 * @param channelId - Channel to display
 * @param workspaceId - Current workspace ID
 * @param onParticipantClick - Called when a participant is clicked
 * @param onTicketClick - Called when a related ticket is clicked
 * @param onAgentSelect - Called when an agent is selected
 */
export function ChannelDetailView({
  channelId,
  workspaceId,
  onParticipantClick,
  onTicketClick,
  onAgentSelect,
}: ChannelDetailViewProps) {
  const channel = getChannel(channelId);
  const messages = listChannelMessages(channelId);
  const allAgents = listProjectAgents();
  const workspaces = listWorkspaces();

  const agentMap: Record<string, { initials: string; id: string }> = {};
  for (const a of allAgents) agentMap[a.name] = { initials: a.initials, id: a.id };

  const workspaceMap: Record<string, string> = {};
  for (const w of workspaces) workspaceMap[w.id] = w.name;

  const [input, setInput] = useState('');
  const [messagesVersion, setMessagesVersion] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesVersion]);

  const handleSend = () => {
    if (!input.trim()) return;
    addChannelMessage(channelId, 'User', input.trim(), false);
    setInput('');
    setMessagesVersion(v => v + 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!channel) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">Channel not found.</p>
      </div>
    );
  }

  const p0 = channel.participants[0] ?? '';
  const p1 = channel.participants[1] ?? '';
  const a0 = agentMap[p0];
  const a1 = agentMap[p1];
  const initialsA = a0?.initials ?? p0.slice(0, 2).toUpperCase() ?? '?';
  const initialsB = a1?.initials ?? p1.slice(0, 2).toUpperCase() ?? '?';
  const wsName = workspaceMap[workspaceId] ?? workspaceId;

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      {/* Header */}
      <div className="shrink-0 border-b border-border/40 px-6 py-3">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0 size-8">
            <Avatar
              size="sm"
              fallback={initialsA}
              className="absolute top-0 left-0 ring-1 ring-card z-10"
            />
            <Avatar
              size="sm"
              fallback={initialsB}
              className="absolute bottom-0 right-0 ring-1 ring-card"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-semibold text-foreground truncate">{channel.topic}</h2>
              <ChannelStatusPill status={channel.status} />
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[10px] text-muted-foreground">
                {channel.participants.join(' ↔ ')}
              </span>
              <span className="text-muted-foreground/40 shrink-0">·</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTicketClick?.(channel.relatedTicketId)}
                className="text-[9px] font-fustat text-muted-foreground bg-secondary/80 rounded px-1 py-0.5 hover:text-foreground transition-colors"
              >
                {channel.relatedTicketId}
              </Button>
              <span className="text-muted-foreground/40 shrink-0">·</span>
              <span className="text-[10px] text-muted-foreground shrink-0">{wsName}</span>
              <span className="text-muted-foreground/40 shrink-0">·</span>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {messages.length} message{messages.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Participant quick-access */}
        <div className="flex items-center gap-3 mt-2">
          {channel.participants.map(name => {
            const ag = Object.values(agentMap).find(a => a.initials === name.slice(0, 2).toUpperCase());
            return (
              <Button
                key={name}
                variant="ghost"
                size="sm"
                onClick={() => ag && onAgentSelect?.(ag.id)}
                className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors p-0 h-auto"
              >
                <Avatar size="xs" fallback={name.slice(0, 2).toUpperCase()} />
                {name}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto px-6 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-xs text-muted-foreground/60 italic">No messages yet.</p>
            <p className="text-[10px] text-muted-foreground/40 mt-1">Send a message to start the conversation.</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border/30">
            {messages.map(msg => (
              <ChannelMessageItem
                key={msg.id}
                msg={msg}
                agentMap={agentMap}
                onParticipantClick={onParticipantClick}
              />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border/40 p-3">
        <div className="flex items-end gap-2">
          <IconButton
            variant="ghost"
            size="sm"
            title="Attach file"
          >
            <Paperclip size={14} strokeWidth={STROKE_WIDTH} />
          </IconButton>
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message…"
            rows={2}
            className="flex-1 resize-none"
          />
          <Button
            variant="default"
            size="sm"
            onClick={handleSend}
            disabled={!input.trim()}
            className="shrink-0 size-8 rounded-md bg-chart-1 flex items-center justify-center text-highlight-foreground hover:bg-chart-1/90 transition-colors disabled:opacity-40"
          >
            <Send size={14} strokeWidth={STROKE_WIDTH} />
          </Button>
        </div>
      </div>
    </div>
  );
}
