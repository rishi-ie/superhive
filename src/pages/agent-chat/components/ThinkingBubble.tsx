import { cn } from '@/lib/utils';

interface ThinkingBubbleProps {
  className?: string;
}

export function ThinkingBubble({ className }: ThinkingBubbleProps) {
  return (
    <div className={cn('flex w-full py-2', className)} role="status">
      <span className="shimmer text-sm text-muted-foreground">
        Thinking
      </span>
    </div>
  );
}
