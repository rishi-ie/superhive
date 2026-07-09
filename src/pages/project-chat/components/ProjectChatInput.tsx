import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { appendMessage } from '@/flows/channels/ui/append-message';

interface ProjectChatInputProps {
  channelId: string;
  senderId: string;
  onMessageSent: (message: unknown) => void;
}

export function ProjectChatInput({ channelId, senderId, onMessageSent }: ProjectChatInputProps) {
  const [text, setText] = React.useState('');
  const [sending, setSending] = React.useState(false);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const msg = await appendMessage(channelId, 'user', senderId, text.trim());
      onMessageSent(msg);
      setText('');
    } finally {
      setSending(false);
    }
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
            void send();
          }
        }}
      />
      <Button onClick={() => void send()} disabled={!text.trim() || sending} size="sm">
        Send
      </Button>
    </div>
  );
}