import { Icon } from "@/components/ui/icon";
import { PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { HugeIcon } from "@/components/ui/huge-icon";
import { Copy01Icon } from "@hugeicons/core-free-icons";
import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/clipboard';
import { editMessage, deleteMessage } from '@/flows/agents/crud';
import { getMessageText } from '@/models/runtime';
import * as React from 'react';
import type { RuntimeMessage } from '@/types/electron';

interface UserMessageProps {
  message: RuntimeMessage;
  agentId: string;
  onDelete?: (messageId: string) => void;
}

export function UserMessage({ message, agentId, onDelete }: UserMessageProps) {
  const text = getMessageText(message);
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(text);
  const draftRef = React.useRef<HTMLTextAreaElement | null>(null);

  React.useEffect(() => {
    if (editing) {
      draftRef.current?.focus()
      draftRef.current?.setSelectionRange(draft.length, draft.length)
    }
  }, [editing, draft.length]);

  const onSave = async () => {
    const next = draft.trim();
    if (!next || next === text) {
      setEditing(false);
      setDraft(text);
      return;
    }
    const result = await editMessage({ agentId, messageId: message.id, newText: next });
    if (result.ok) setEditing(false);
  };

  const onCancel = () => {
    setEditing(false);
    setDraft(text);
  };

  const onDeleteClick = async () => {
    if (typeof onDelete === 'function') onDelete(message.id);
    else await deleteMessage({ agentId, messageId: message.id });
  };

  if (editing) {
    return (
      <div className="group relative w-full py-button-y">
        <div className="ml-auto flex flex-col gap-1.5 rounded-card border border-primary/50 bg-sidebar p-2 max-w-[80%]">
          <textarea
            ref={draftRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void onSave();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                onCancel();
              }
            }}
            rows={3}
            className="w-full resize-y bg-transparent text-[14px] leading-relaxed text-foreground outline-none"
          />
          <div className="flex items-center justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={onCancel} className="h-7">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => void onSave()}
              disabled={!draft.trim() || draft.trim() === text}
              className="h-7"
            >
              Save &amp; resend
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
          onClick={() => setEditing(true)}
          aria-label="Edit message"
        >
          <Icon icon={PencilSimpleIcon} className="size-3.5" />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground h-7 w-7 border-0"
          onClick={() => void onDeleteClick()}
          aria-label="Delete message"
        >
          <Icon icon={TrashIcon} className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
