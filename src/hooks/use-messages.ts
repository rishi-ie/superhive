import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listMessages,
  addMessage,
  deleteMessages,
  type Message,
  type MessageInput,
} from '@/db';

const KEY = ['messages'] as const;

export function useMessages(sessionId: string | undefined) {
  return useQuery({
    queryKey: [...KEY, sessionId],
    queryFn: () => listMessages(sessionId as string),
    enabled: Boolean(sessionId),
  });
}

export function useAddMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MessageInput) => addMessage(input),
    onSuccess: (created: Message) => {
      qc.invalidateQueries({ queryKey: [...KEY, created.sessionId] });
    },
  });
}

export function useDeleteMessages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => deleteMessages(sessionId),
    onSuccess: (_, sessionId) => {
      qc.invalidateQueries({ queryKey: [...KEY, sessionId] });
    },
  });
}
