import { HugeIcon } from '@/components/ui/huge-icon'
import { SparklesIcon } from '@hugeicons/core-free-icons'
import { EmptyState } from '@/components/common/EmptyState'

interface SuggestedPromptsProps {
  onSelect?: (prompt: string) => void
}

const DEFAULT_PROMPTS: Array<{ title: string; prompt: string }> = [
  {
    title: 'Explain this codebase',
    prompt: 'Walk me through the structure of this codebase and explain the main pieces.',
  },
  {
    title: 'Find bugs',
    prompt: 'Look at the recent changes and flag any bugs or risky code paths.',
  },
  {
    title: 'Refactor a file',
    prompt: 'Pick a file you think could be cleaner and suggest a refactor.',
  },
  {
    title: 'Add tests',
    prompt: 'Write tests for an under-tested module that needs coverage.',
  },
]

/**
 * Phase 12.2 — suggested prompts grid. Clicking a card calls `onSelect(prompt)`
 * which the chat view uses to seed the composer.
 */
export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-3xl w-full px-6 mt-6">
      {DEFAULT_PROMPTS.map((p) => (
        <button
          key={p.title}
          type="button"
          onClick={() => onSelect?.(p.prompt)}
          className="text-left rounded-card border border-border bg-background hover:bg-muted/40 transition-colors p-3 cursor-pointer"
        >
          <div className="flex items-start gap-2">
            <HugeIcon icon={SparklesIcon} size={14} className="size-3.5 mt-0.5 text-muted-foreground" />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-foreground">{p.title}</span>
              <span className="text-xs text-muted-foreground line-clamp-2">{p.prompt}</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

interface ChatEmptyStateProps {
  agentName?: string
  onPromptSelect?: (prompt: string) => void
}

/**
 * Phase 12.1 — replaces the plain `<p>` placeholder with a welcoming
 * empty state: sparkles icon, welcome heading (uses the agent's name when
 * available), and a suggested-prompts grid.
 */
export function ChatEmptyState({ agentName, onPromptSelect }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <EmptyState
        icon={
          <div className="flex size-12 items-center justify-center rounded-full bg-accent">
            <HugeIcon icon={SparklesIcon} size={22} className="size-5.5 text-foreground" />
          </div>
        }
        title={agentName ? `Start a conversation with ${agentName}` : 'Start a conversation'}
        description="Pick a prompt below or type your own message to begin."
      />
      <SuggestedPrompts onSelect={onPromptSelect} />
    </div>
  )
}
