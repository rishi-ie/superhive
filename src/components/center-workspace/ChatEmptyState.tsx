import { MessageSquare, Zap } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';

type ChatEmptyStateProps = {
  title?: string;
  onSuggestionClick?: (text: string) => void;
};

const suggestions = [
  'Build a landing page',
  'Research competitors',
  'Create product spec',
  'Generate marketing plan',
  'Analyze codebase',
];

export function ChatEmptyState({
  title = 'What would you like your workforce to do?',
  onSuggestionClick,
}: ChatEmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-6 max-w-md">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center size-16 rounded-full bg-secondary">
            <MessageSquare size={28} className="text-muted-foreground" strokeWidth={STROKE_WIDTH} />
          </div>
          <p className="text-sm text-muted-foreground text-center">{title}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => onSuggestionClick?.(suggestion)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-left rounded-md border border-border bg-secondary text-foreground hover:bg-tertiary transition-colors"
            >
              <Zap size={12} className="text-chart-1 shrink-0" strokeWidth={STROKE_WIDTH} />
              <span className="truncate">{suggestion}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
