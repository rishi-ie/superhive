import { Check, Loader2 } from 'lucide-react';
import { INIT_STEPS } from '@/types/init-steps';
import type { InitStep } from '@/types/electron';
import { cn } from '@/lib/utils';

interface AgentInitializingProps {
  currentStep?: InitStep;
  agentName?: string;
}

export function AgentInitializing({ currentStep, agentName }: AgentInitializingProps) {
  const activeIndex = currentStep
    ? INIT_STEPS.findIndex((s) => s.id === currentStep)
    : -1;

  return (
    <div className="flex h-full w-full items-center justify-center bg-background">
      <div className="flex w-full max-w-md flex-col gap-5 px-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-medium text-foreground">
            {agentName ? `Starting ${agentName}` : 'Initializing agent'}
          </h2>
          <p className="text-sm text-muted-foreground">
            This may take up to 30 seconds on first run.
          </p>
        </div>

        <ol className="flex flex-col gap-1">
          {INIT_STEPS.map((step, idx) => {
            const isDone = activeIndex > idx;
            const isActive = activeIndex === idx;
            const isPending = activeIndex < idx;
            return (
              <li
                key={step.id}
                className={cn(
                  'flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors',
                  isActive && 'bg-muted/40',
                  isPending && 'opacity-50'
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full',
                    isDone && 'bg-emerald-500/15 text-emerald-400',
                    isActive && 'bg-foreground/10 text-foreground',
                    isPending && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isDone ? (
                    <Check className="size-3" />
                  ) : isActive ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <span className="block size-1.5 rounded-full bg-current" />
                  )}
                </span>
                <span
                  className={cn(
                    'text-sm',
                    isDone && 'text-muted-foreground',
                    isActive && 'font-medium text-foreground',
                    isPending && 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}