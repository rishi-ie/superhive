import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ContextUsageRingProps {
  percent: number;
  usedTokens?: number;
  maxTokens?: number;
  size?: number;
  className?: string;
}

const DEFAULT_SIZE = 20;
const RADIUS = 9;
const STROKE = 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function clampPercent(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

function formatTokens(n: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(n));
}

export function ContextUsageRing({
  percent,
  usedTokens,
  maxTokens,
  size = DEFAULT_SIZE,
  className,
}: ContextUsageRingProps) {
  const hasTokens =
    typeof usedTokens === 'number' &&
    typeof maxTokens === 'number' &&
    maxTokens > 0;
  const unknownWindow = !hasTokens;
  const clamped = unknownWindow ? 0 : clampPercent(percent);
  const offset = CIRCUMFERENCE * (1 - clamped / 100);
  const tooltipText = unknownWindow
    ? 'Context window unknown — register the provider or pick a model with a known size'
    : `Context: ${Math.round(clamped)}% (${formatTokens(usedTokens!)} / ${formatTokens(maxTokens!)} tokens)`;

  return (
    <Tooltip>
      <TooltipTrigger
        aria-label={tooltipText}
        className={cn(
          'relative inline-flex items-center justify-center text-sidebar-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full',
          unknownWindow && 'opacity-60',
          className,
        )}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 20 20"
          aria-hidden
          className="block"
        >
          <circle
            cx="10"
            cy="10"
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.18"
            strokeWidth={STROKE}
          />
          {!unknownWindow && (
            <circle
              cx="10"
              cy="10"
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              transform="rotate(-90 10 10)"
            />
          )}
        </svg>
        {unknownWindow && (
          <span
            aria-hidden
            className="absolute inset-0 flex items-center justify-center text-[10px] leading-none text-sidebar-foreground/70"
          >
            ?
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent>{tooltipText}</TooltipContent>
    </Tooltip>
  );
}