import { cn } from '@/lib/utils';

interface ThinkingBubbleProps {
  className?: string;
}

export function ThinkingBubble({ className }: ThinkingBubbleProps) {
  return (
    <div className={cn('flex w-full py-2', className)}>
      <div className="flex items-center gap-1 rounded-lg bg-muted/40 px-3 py-2">
        <span className="block size-1.5 rounded-full bg-muted-foreground/60 animate-pulse [animation-delay:-0.3s]" />
        <span className="block size-1.5 rounded-full bg-muted-foreground/60 animate-pulse [animation-delay:-0.15s]" />
        <span className="block size-1.5 rounded-full bg-muted-foreground/60 animate-pulse" />
      </div>
    </div>
  );
}