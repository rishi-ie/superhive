/**
 * Empty state with quick-start suggestion cards.
 */
import { useMemo } from 'react';
import { Zap, Search, Code2, FileText, BarChart3, Bot, Layers, type LucideIcon } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { listChatQuickStart } from '@/data/chat/store';

type ChatEmptyStateProps = {
  agentName?: string;
  onSuggestionClick?: (text: string) => void;
};

const ICON_MAP: Record<string, LucideIcon> = {
  layers: Layers,
  code: Code2,
  search: Search,
  file: FileText,
  chart: BarChart3,
  bot: Bot,
};

/**
 * @param agentName - Name of agent (shown in prompt if set)
 * @param onSuggestionClick - Called when a quick-start card is clicked
 */
export function ChatEmptyState({ agentName, onSuggestionClick }: ChatEmptyStateProps) {
  const quickStart = useMemo(() => listChatQuickStart(), []);

  if (quickStart.length === 0) return null;

  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="flex flex-col items-center gap-5 max-w-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center justify-center size-12 rounded-full bg-secondary">
            <Zap size={22} className="text-accent" strokeWidth={STROKE_WIDTH} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {agentName ? `Chat with ${agentName}` : 'What would you like to do?'}
            </p>
            <p className="text-xs text-muted-foreground/70 leading-relaxed">
              {agentName
                ? `${agentName} is ready to help with coding, analysis, planning, and more.`
                : 'Describe an objective or pick a starting point below.'}
            </p>
          </div>
        </div>

        <div className="w-full space-y-1.5">
          {quickStart.map(item => {
            const Icon = ICON_MAP[item.icon] ?? Layers;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => onSuggestionClick?.(item.label)}
                className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg border border-border/40 bg-card hover:border-border/80 hover:bg-hover-tint transition-colors text-left group"
              >
                <Icon
                  size={14}
                  strokeWidth={STROKE_WIDTH}
                  className="text-accent shrink-0 mt-0.5 group-hover:text-accent/80 transition-colors"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{item.label}</span>
                    <span className="text-[8px] font-medium uppercase tracking-wider text-muted-foreground/50 bg-secondary px-1 py-0.5 rounded">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5 leading-relaxed">{item.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-[10px] text-muted-foreground/40 text-center">
          or type a message to get started
        </p>
      </div>
    </div>
  );
}
