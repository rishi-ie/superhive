import { Zap, Search, Code2, FileText, BarChart3, Bot, Layers } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';

type ChatEmptyStateProps = {
  agentName?: string;
  onSuggestionClick?: (text: string) => void;
};

const QUICK_START = [
  { icon: Layers, label: 'Sprint planning', description: 'Break down a sprint goal into tickets', category: 'Planning' },
  { icon: Code2, label: 'Review this PR', description: 'Analyze a pull request for issues', category: 'Code' },
  { icon: Search, label: 'Research competitors', description: 'Compare features and pricing', category: 'Research' },
  { icon: FileText, label: 'Write documentation', description: 'Generate or update docs', category: 'Docs' },
  { icon: BarChart3, label: 'Analyze performance', description: 'Review metrics and suggest improvements', category: 'Analytics' },
  { icon: Bot, label: 'Configure an agent', description: 'Set up permissions and scope', category: 'Agents' },
];

export function ChatEmptyState({ agentName, onSuggestionClick }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="flex flex-col items-center gap-5 max-w-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center justify-center size-12 rounded-full bg-secondary">
            <Zap size={22} className="text-chart-1" strokeWidth={STROKE_WIDTH} />
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
          {QUICK_START.map(item => (
            <button
              key={item.label}
              type="button"
              onClick={() => onSuggestionClick?.(item.label)}
              className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg border border-border/40 bg-card hover:border-border/80 hover:bg-white/5 transition-colors text-left group"
            >
              <item.icon
                size={14}
                strokeWidth={STROKE_WIDTH}
                className="text-chart-1 shrink-0 mt-0.5 group-hover:text-chart-1/80 transition-colors"
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
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground/40 text-center">
          or type a message to get started
        </p>
      </div>
    </div>
  );
}
