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
  const hasUsageOnly =
    !hasTokens && typeof usedTokens === 'number' && usedTokens > 0;
  const clamped = unknownWindow ? 0 : clampPercent(percent);
  const offset = CIRCUMFERENCE * (1 - clamped / 100);
  const tooltipText = unknownWindow
    ? typeof usedTokens === 'number' && usedTokens > 0
      ? `Context: ${formatTokens(usedTokens)} tokens consumed — window size unknown`
      : 'Context consumption unknown'
    : `Context: ${Math.round(clamped)}% (${formatTokens(usedTokens!)} / ${formatTokens(maxTokens!)} tokens)`;

  // Unknown window: don't render the SVG ring. Show only the consumed
  // tokens count as plain text — no "?", no percentage, no cap.
  if (unknownWindow) {
    return (
      <Tooltip>
        <TooltipTrigger
          aria-label={tooltipText}
          className={cn(
            'inline-flex items-center text-[10px] font-mono text-sidebar-foreground/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-button px-1 cursor-default',
            className,
          )}
        >
          {hasUsageOnly ? `${formatTokens(usedTokens!)} tok` : '—'}
        </TooltipTrigger>
        <TooltipContent>{tooltipText}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        aria-label={tooltipText}
        className={cn(
          'relative inline-flex items-center justify-center text-sidebar-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full',
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
        </svg>
      </TooltipTrigger>
      <TooltipContent>{tooltipText}</TooltipContent>
    </Tooltip>
  );
}