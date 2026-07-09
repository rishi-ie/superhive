import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ProjectChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ProjectChatInput({ onSend, disabled = false }: ProjectChatInputProps) {
  const [text, setText] = React.useState('');
  const trimmed = text.trim();
  const canSend = trimmed.length > 0 && !disabled;

  const send = () => {
    if (!canSend) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <div className="flex items-end gap-2 border-t border-border p-3">
      <Textarea
        className="min-h-[60px] resize-none"
        placeholder="Message the project agent..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
      />
      <Button onClick={send} disabled={!canSend} size="sm">
        Send
      </Button>
    </div>
  );
}