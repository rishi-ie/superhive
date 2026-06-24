import { useState } from 'react';
import { Copy, ThumbsUp, ThumbsDown, RotateCcw, Check } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { STROKE_WIDTH } from '@/lib/constants';
import { parseMarkdown, type MarkdownBlock, type InlineElement } from '@/lib/markdown';
import type { Message } from '@/data/chat/store';
import { setMessageFeedback } from '@/data/chat/store';

type ChatMessageProps = {
  message: Message;
  agentName?: string;
  agentInitials?: string;
  agentStatusColor?: string;
  onRegenerate?: (messageId: string) => void;
};

function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'yesterday';
  return `${diffDays}d ago`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function renderInline(inline: InlineElement, key: number) {
  switch (inline.kind) {
    case 'code':
      return (
        <code key={key} className="bg-secondary px-1 py-0.5 rounded text-[11px] font-fustat text-foreground">
          {inline.value}
        </code>
      );
    case 'bold':
      return <strong key={key} className="font-semibold">{inline.value}</strong>;
    case 'italic':
      return <em key={key} className="italic">{inline.value}</em>;
    case 'link':
      return (
        <a key={key} href={inline.href} target="_blank" rel="noopener noreferrer" className="text-chart-1 underline hover:opacity-80">
          {inline.value}
        </a>
      );
    case 'text':
      return <span key={key}>{inline.value}</span>;
  }
}

function renderBlock(block: MarkdownBlock, key: number) {
  if (block.kind === 'codeblock') {
    const lang = block.lang || 'code';
    return (
      <div key={key} className="my-2 rounded-md border border-border/40 bg-sidebar overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/40 bg-secondary/50">
          <span className="text-[9px] font-fustat uppercase tracking-wider text-muted-foreground/60">{lang}</span>
          <button
            type="button"
            className="flex items-center gap-1 text-[9px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            onClick={() => navigator.clipboard.writeText(block.code)}
          >
            <Copy size={10} strokeWidth={STROKE_WIDTH} />
            copy
          </button>
        </div>
        <pre className="p-3 text-[11px] font-fustat text-foreground overflow-x-auto leading-relaxed whitespace-pre-wrap">
          <code>{block.code}</code>
        </pre>
      </div>
    );
  }

  return (
    <p key={key} className="text-sm leading-relaxed text-foreground space-x-0.5">
      {block.inlines.map((inline, i) => renderInline(inline as Parameters<typeof renderInline>[0], i))}
    </p>
  );
}

export function ChatMessage({ message, agentName, agentInitials, onRegenerate }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const blocks = parseMarkdown(message.content);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = (fb: 'up' | 'down') => {
    const newFeedback = message.feedback === fb ? null : fb;
    setMessageFeedback(message.id, newFeedback);
  };

  const initials = isUser ? 'You' : (agentInitials ?? '??');
  const name = isUser ? 'You' : (agentName ?? 'Assistant');

  return (
    <div className={`flex gap-3 group ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <Avatar
        size="sm"
        fallback={initials}
        className={isUser ? 'shrink-0' : 'shrink-0'}
      />

      <div className={`flex flex-col gap-1 max-w-[72%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`flex items-center gap-1.5 px-1 flex-wrap ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[11px] font-semibold text-foreground">{name}</span>
          <span className="text-[10px] text-muted-foreground/60 font-fustat">{formatTime(message.timestamp)}</span>
          {message.model && (
            <span className="text-[9px] font-fustat text-muted-foreground/50 bg-secondary px-1.5 py-0.5 rounded-full">
              {message.model}
            </span>
          )}
          {message.tokenCount != null && (
            <span className="text-[9px] font-fustat text-muted-foreground/50">
              {message.tokenCount} tok
            </span>
          )}
          {message.durationMs != null && (
            <span className="text-[9px] font-fustat text-muted-foreground/50">
              · {formatDuration(message.durationMs)}
            </span>
          )}
          {isUser && message.status === 'sending' && (
            <span className="text-[9px] text-muted-foreground/60">sending…</span>
          )}
        </div>

        <div
          className={`px-3 py-2 rounded-2xl text-sm ${
            isUser
              ? 'bg-chart-1 text-highlight-foreground rounded-tr-md'
              : 'bg-card border border-border/60 text-foreground rounded-tl-md'
          }`}
        >
          <div className="space-y-1.5">
            {blocks.map((block, i) => renderBlock(block, i))}
          </div>
        </div>

        {!isUser && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 px-1">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-muted-foreground/60 hover:text-foreground hover:bg-white/5 transition-colors"
            >
              {copied ? <Check size={11} strokeWidth={STROKE_WIDTH} /> : <Copy size={11} strokeWidth={STROKE_WIDTH} />}
              {copied ? 'copied' : 'copy'}
            </button>
            <button
              type="button"
              onClick={() => handleFeedback('up')}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                message.feedback === 'up'
                  ? 'text-chart-2 bg-chart-2/10'
                  : 'text-muted-foreground/60 hover:text-foreground hover:bg-white/5'
              }`}
            >
              <ThumbsUp size={11} strokeWidth={STROKE_WIDTH} />
            </button>
            <button
              type="button"
              onClick={() => handleFeedback('down')}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                message.feedback === 'down'
                  ? 'text-chart-5 bg-chart-5/10'
                  : 'text-muted-foreground/60 hover:text-foreground hover:bg-white/5'
              }`}
            >
              <ThumbsDown size={11} strokeWidth={STROKE_WIDTH} />
            </button>
            {onRegenerate && (
              <button
                type="button"
                onClick={() => onRegenerate(message.id)}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-muted-foreground/60 hover:text-foreground hover:bg-white/5 transition-colors"
              >
                <RotateCcw size={11} strokeWidth={STROKE_WIDTH} />
                regenerate
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
