import * as React from 'react';
import { HugeIcon } from '@/components/ui/huge-icon';
import { Loading03Icon, AlertCircleIcon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CompactionStatus, RetryStatus } from '@/models/runtime';

interface ActiveStateBannersProps {
  compaction?: CompactionStatus
  retry?: RetryStatus
  onCancel: () => void
}

/**
 * Top-of-conversation banners for active states: compaction in flight,
 * auto-retry waiting. Both have an Esc/Cancel button wired to the agent
 * stop IPC.
 */
export function ActiveStateBanners({
  compaction,
  retry,
  onCancel,
}: ActiveStateBannersProps) {
  return (
    <div className="flex flex-col gap-2">
      {compaction ? (
        <CompactionBanner onCancel={onCancel} />
      ) : null}
      {retry ? (
        <RetryBanner retry={retry} onCancel={onCancel} />
      ) : null}
    </div>
  )
}

function CompactionBanner({ onCancel }: { onCancel: () => void }) {
  return (
    <div className={cn(
      'flex items-center gap-2 rounded-card border border-border bg-background px-3 py-2 text-xs text-muted-foreground',
    )}>
      <HugeIcon icon={Loading03Icon} size={14} className="size-3.5 animate-spin text-chat-status-warning" />
      <span>Compacting context… <span className="text-foreground/70">(Esc to cancel)</span></span>
      <Button
        size="icon-sm"
        variant="ghost"
        onClick={onCancel}
        title="Cancel compaction"
        className="ml-auto text-muted-foreground hover:text-foreground"
      >
        <HugeIcon icon={Cancel01Icon} size={14} className="size-3.5" />
      </Button>
    </div>
  )
}

function RetryBanner({
  retry,
  onCancel,
}: {
  retry: RetryStatus
  onCancel: () => void
}) {
  const [elapsed, setElapsed] = React.useState(0)
  React.useEffect(() => {
    setElapsed(0)
    const start = Date.now()
    const t = setInterval(() => {
      const remaining = Math.max(0, retry.delayMs - (Date.now() - start))
      setElapsed(Math.min(retry.delayMs, retry.delayMs - remaining))
    }, 100)
    return () => clearInterval(t)
  }, [retry.delayMs, retry.startedAt])
  const progress = Math.min(1, elapsed / Math.max(retry.delayMs, 1))
  return (
    <div className="relative flex items-center gap-2 rounded-card border border-border bg-background px-3 py-2 text-xs text-muted-foreground overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 bg-chat-status-error/10 transition-[width] duration-100"
        style={{ width: `${progress * 100}%` }}
      />
      <HugeIcon icon={AlertCircleIcon} size={14} className="size-3.5 text-chat-status-error relative" />
      <span className="relative">
        Auto-retrying ({retry.attempt}/{retry.maxAttempts})… {retry.errorMessage}
      </span>
      <Button
        size="icon-sm"
        variant="ghost"
        onClick={onCancel}
        title="Cancel retry"
        className="ml-auto text-muted-foreground hover:text-foreground relative"
      >
        <HugeIcon icon={Cancel01Icon} size={14} className="size-3.5" />
      </Button>
    </div>
  )
}
