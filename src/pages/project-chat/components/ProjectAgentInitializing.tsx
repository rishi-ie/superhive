/**
 * Forked from `src/pages/agent-chat/components/AgentInitializing`.
 *
 * Project-agent runtimes are intentionally forked from agent runtimes
 * so they can evolve independently. If you change lifecycle / boot UX
 * here, also check `AgentInitializing` and decide whether to keep them
 * in sync.
 */

import { useEffect, useRef, useState } from 'react';
import { Icon } from "@/components/ui/icon";
import { CheckIcon, CircleNotchIcon, ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { INIT_STEPS } from '@/models/runtime';
import type { InitStep } from '@/models/runtime';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ProjectAgentInitializingProps {
  currentStep?: InitStep;
  agentName?: string;
  lastError?: string;
  onRestart: () => void;
}

const STUCK_THRESHOLD_MS = 90_000;

export function ProjectAgentInitializing({ currentStep, agentName, lastError, onRestart }: ProjectAgentInitializingProps) {
  const activeIndex = currentStep
    ? INIT_STEPS.findIndex((s) => s.id === currentStep)
    : -1;

  const [stuck, setStuck] = useState(false);
  const stepRef = useRef(currentStep);

  useEffect(() => {
    if (currentStep && currentStep !== stepRef.current) {
      stepRef.current = currentStep;
      setStuck(false);
    }
  }, [currentStep]);

  useEffect(() => {
    const timer = setTimeout(() => setStuck(true), STUCK_THRESHOLD_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-full w-full items-center justify-center bg-background">
      <div className="flex w-full max-w-md flex-col gap-5 px-6">
        <div className="flex flex-col gap-gap-tight">
          <h2 className="text-base font-medium text-foreground">
            {agentName ? `Starting ${agentName}` : 'Initializing project agent'}
          </h2>
          {stuck ? (
            <div className="flex flex-col gap-stack">
              <p className="text-sm text-muted-foreground">
                This is taking longer than usual.
              </p>
              {lastError && (
                <p className="text-xs font-mono text-destructive break-words">
                  {lastError}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              This may take up to 90 seconds on first run.
            </p>
          )}
        </div>

        <ol className="flex flex-col gap-gap-tight">
          {INIT_STEPS.map((step, idx) => {
            const isDone = activeIndex > idx;
            const isActive = activeIndex === idx;
            const isPending = activeIndex < idx;
            return (
              <li
                key={step.id}
                className={cn(
                  'flex items-center gap-gap-loose rounded-button px-row py-1.5 transition-colors',
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
                    <Icon icon={CheckIcon} className="size-3" />
                  ) : isActive ? (
                    <Icon icon={CircleNotchIcon} className="size-3 animate-spin" />
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

        {stuck && (
          <div className="flex items-center gap-stack">
            <Button size="sm" variant="outline" onClick={onRestart} className="gap-list-item">
              <Icon icon={ArrowsClockwiseIcon} className="size-3.5" />
              Restart
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}