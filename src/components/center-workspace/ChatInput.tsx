/**
 * Auto-expanding textarea with model picker and token counter.
 */
import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, ChevronDown } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Textarea } from '@/components/ui/Textarea';
import { Pill } from '@/components/ui/Pill';
import { MODEL_LABELS } from '@/data/config/models';

type ChatInputProps = {
  placeholder?: string;
  defaultModel?: string;
  onSubmit?: (text: string, model: string) => void;
  agentId?: string;
};

const CHAR_TOKEN_RATIO = 4; // rough estimate: 1 token ≈ 4 chars

function countTokens(text: string): number {
  return Math.ceil(text.length / CHAR_TOKEN_RATIO);
}

const DRAFT_KEY = (agentId?: string) =>
  agentId ? `superhive-draft-${agentId}` : 'superhive-draft';

/**
 * @param placeholder - Input placeholder text
 * @param defaultModel - Default selected model
 * @param onSubmit - Called with (text, model) when send is clicked
 * @param agentId - Agent ID for draft persistence
 */
export function ChatInput({ placeholder = 'Describe an objective…', defaultModel = 'Auto', onSubmit, agentId }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [model, setModel] = useState(defaultModel);
  const [autoMode, setAutoMode] = useState(true);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY(agentId));
    if (saved) setValue(saved);
  }, [agentId]);

  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY(agentId));
    if (savedDraft !== value) {
      const timer = setTimeout(() => {
        if (value) localStorage.setItem(DRAFT_KEY(agentId), value);
        else localStorage.removeItem(DRAFT_KEY(agentId));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [value, agentId]);

  const handleSubmit = () => {
    const text = value.trim();
    if (!text) return;
    onSubmit?.(text, autoMode ? 'Auto' : model);
    setValue('');
    localStorage.removeItem(DRAFT_KEY(agentId));
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  };

  const tokens = countTokens(value);

  return (
    <div className="shrink-0 border-t border-border/40 bg-sidebar">
      <div className="px-4 py-2.5">
        <div className="flex items-start gap-2 bg-input rounded-lg px-3 py-2 border border-border/60 focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/20 transition-all">
          <Textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none resize-none leading-relaxed"
          />
          <div className="flex items-center gap-1 shrink-0 pt-0.5">
            {tokens > 0 && (
              <span className="text-[9px] font-fustat text-muted-foreground/50 mr-1">
                {tokens.toLocaleString()} tok
              </span>
            )}
            <IconButton
              variant="ghost"
              size="sm"
              aria-label="Attach file"
              onClick={() => {}}
            >
              <Paperclip size={15} strokeWidth={STROKE_WIDTH} />
            </IconButton>
          </div>
        </div>

        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <Pill
                active={autoMode}
                onClick={() => setAutoMode(a => !a)}
              >
                Auto
              </Pill>
            </div>

            {!autoMode && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowModelPicker(p => !p)}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors border border-transparent"
                >
                  <span>{model}</span>
                  <ChevronDown size={9} strokeWidth={STROKE_WIDTH} />
                </Button>
                {showModelPicker && (
                  <div className="absolute bottom-full left-0 mb-1 w-32 rounded-md border border-border bg-card shadow-lg z-10 overflow-hidden">
                    {MODEL_LABELS.filter(m => m !== 'Auto').map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => { setModel(m); setShowModelPicker(false); }}
                        className={`w-full text-left px-2.5 py-1.5 text-[11px] transition-colors ${
                          m === model ? 'bg-chart-1/10 text-chart-1' : 'text-foreground hover:bg-white/5'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={handleSubmit}
            disabled={!value.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-chart-1 text-highlight-foreground text-xs font-semibold hover:bg-chart-1/90 transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            <span>Send</span>
            <Send size={12} strokeWidth={STROKE_WIDTH} />
          </Button>
        </div>
      </div>
    </div>
  );
}
