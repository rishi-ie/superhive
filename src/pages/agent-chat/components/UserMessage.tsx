import { Icon } from "@/components/ui/icon";
import { PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { HugeIcon } from "@/components/ui/huge-icon";
import { Copy01Icon } from "@hugeicons/core-free-icons";
import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/clipboard';
import { getMessageText } from '@/models/runtime';
import type { RuntimeMessage } from '@/types/electron';

interface UserMessageProps {
  message: RuntimeMessage;
  onEdit?: (messageId: string, newText: string) => void;
  onDelete?: (messageId: string) => void;
}

export function UserMessage({ message, onEdit, onDelete }: UserMessageProps) {
  const text = getMessageText(message);
  return (
    <div className="group relative w-full py-button-y">
      <div className="w-fit ml-auto rounded-card bg-sidebar px-button-x py-button-y">
        <p className="text-[14px] leading-relaxed text-foreground/90 whitespace-pre-wrap break-words">
          {text}
        </p>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-gap-tight mt-1 justify-end">
        <span className="text-[11px] text-muted-foreground mr-1">
          {new Date(message.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <Button
          size="icon-sm"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground h-7 w-7 border-0"
          onClick={() => copyToClipboard(text)}
          aria-label="Copy message"
        >
          <HugeIcon icon={Copy01Icon} size={14} className="size-3.5" />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground h-7 w-7 border-0"
          onClick={() => onEdit?.(message.id, text)}
          aria-label="Edit message"
          disabled={!onEdit}
        >
          <Icon icon={PencilSimpleIcon} className="size-3.5" />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground h-7 w-7 border-0"
          onClick={() => onDelete?.(message.id)}
          aria-label="Delete message"
          disabled={!onDelete}
        >
          <Icon icon={TrashIcon} className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
