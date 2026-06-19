import { useState } from 'react';
import { Send, Paperclip, Mic, ChevronDown } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';

type ChatInputProps = {
  placeholder?: string;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  onSubmit?: (text: string) => void;
};

export function ChatInput({
  placeholder = 'Describe an objective...',
  primaryActionLabel = 'Auto',
  secondaryActionLabel = 'Opus 4.8',
  onSubmit,
}: ChatInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    if (value.trim() && onSubmit) onSubmit(value);
  };

  return (
    <div className="border-t border-border bg-sidebar p-3 space-y-2">
      <div className="flex items-start gap-2 bg-input rounded-lg px-3 py-2 border border-border focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20 transition-all">
        <textarea
          rows={3}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleSubmit();
            }
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none"
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground bg-secondary hover:bg-tertiary rounded-md transition-colors">
            <span>{primaryActionLabel}</span>
            <ChevronDown size={12} />
          </button>
          <button className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground bg-secondary hover:bg-tertiary rounded-md transition-colors">
            <span>{secondaryActionLabel}</span>
            <ChevronDown size={12} />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button className="flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors" aria-label="Attach file">
            <Paperclip size={16} strokeWidth={STROKE_WIDTH} />
          </button>
          <button className="flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors" aria-label="Voice input">
            <Mic size={16} strokeWidth={STROKE_WIDTH} />
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center justify-center size-8 rounded-md bg-chart-1 text-highlight-foreground hover:bg-chart-1/90 transition-colors"
            aria-label="Send"
          >
            <Send size={16} strokeWidth={STROKE_WIDTH} />
          </button>
        </div>
      </div>
    </div>
  );
}
