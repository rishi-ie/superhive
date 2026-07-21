import {
  CheckCircleIcon,
  LockKeyIcon,
  QuestionIcon,
  XIcon,
  type Icon,
} from "@phosphor-icons/react";
import { Icon as IconWrapper } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InboxAction, InboxItemKind, InboxOutcome } from "@/models/component";

export type { InboxItemKind, InboxAction, InboxOutcome };

interface InboxItemRowProps {
  kind: InboxItemKind;
  title: string;
  description?: string;
  timestamp?: string;
  awaiting?: boolean;
  outcome?: InboxOutcome;
  actions?: InboxAction[];
  onFocus?: () => void;
  onAction?: (action: InboxAction) => void;
}

const iconMap: Record<InboxItemKind, Icon> = {
  approval: LockKeyIcon,
  question: QuestionIcon,
  status: CheckCircleIcon,
};

const iconClass: Record<InboxItemKind, string> = {
  approval: "text-chat-status-warning",
  question: "text-chat-status-running",
  status: "text-chat-status-success",
};

export function InboxItemRow({
  kind,
  title,
  description,
  timestamp,
  awaiting,
  outcome,
  actions,
  onFocus,
  onAction,
}: InboxItemRowProps) {
  const IconComp = iconMap[kind];
  const resolved = outcome !== undefined;
  const showAwaiting = awaiting && !resolved;
  const hasActions = (actions?.length ?? 0) > 0 && !resolved;
  const dismissAction = actions?.find((a) => a.kind === "dismiss");

  return (
    <div
      className={cn(
        "rounded-button px-2 py-1.5 transition-colors hover:bg-muted",
        resolved && "opacity-60 hover:bg-transparent",
      )}
    >
      <div className="flex items-start gap-list-item">
        <IconWrapper
          icon={IconComp}
          className={cn("mt-0.5 size-3.5 shrink-0", iconClass[kind])}
        />
        <button
          type="button"
          onClick={onFocus}
          className="-mx-1 flex min-w-0 flex-1 cursor-default items-start gap-list-item rounded px-1 py-px text-left"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex items-center gap-list-item">
              <span className="truncate text-sm text-foreground">{title}</span>
              {showAwaiting && (
                <span className="shrink-0 rounded-button bg-warning/15 px-1.5 py-px text-[10px] font-medium text-warning">
                  Awaiting
                </span>
              )}
            </div>
            {description && (
              <span className="truncate text-xs text-muted-foreground/70">
                {description}
              </span>
            )}
          </div>
          {timestamp && (
            <span className="shrink-0 self-start pt-0.5 text-xs tabular-nums text-muted-foreground/60">
              {timestamp}
            </span>
          )}
        </button>
        {dismissAction && onAction && (
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={() => onAction(dismissAction)}
            title="Dismiss"
            aria-label="Dismiss"
            className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
          >
            <IconWrapper icon={XIcon} />
          </Button>
        )}
      </div>

      {(hasActions || resolved) && (
        <div className="mt-1.5 pl-[22px]">
          {!resolved && actions ? (
            <div className="flex flex-wrap gap-1">
              {actions
                .filter((a) => a.kind !== "dismiss")
                .map((action, i) => (
                  <Button
                    key={i}
                    size="xs"
                    variant={
                      action.kind === "allow"
                        ? "default"
                        : action.kind === "deny"
                          ? "destructive"
                          : "outline"
                    }
                    onClick={() => onAction?.(action)}
                  >
                    {action.label}
                  </Button>
                ))}
            </div>
          ) : resolved ? (
            <OutcomeLabel outcome={outcome} />
          ) : null}
        </div>
      )}
    </div>
  );
}

function OutcomeLabel({ outcome }: { outcome: InboxOutcome }) {
  const text =
    outcome.kind === "allowed"
      ? "Allowed"
      : outcome.kind === "denied"
        ? "Denied"
        : outcome.kind === "answered"
          ? `Answered: ${outcome.label}`
          : "Dismissed";
  const color =
    outcome.kind === "allowed" || outcome.kind === "answered"
      ? "text-chat-status-success"
      : outcome.kind === "denied"
        ? "text-destructive"
        : "text-muted-foreground";
  return (
    <div className={cn("flex items-center gap-1 text-xs", color)}>
      <IconWrapper icon={CheckCircleIcon} className="size-3" />
      <span>{text}</span>
    </div>
  );
}