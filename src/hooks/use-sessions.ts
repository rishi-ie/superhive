import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listSessions,
  createSession,
  deleteSession,
  type Session,
  type SessionCategory,
  type SessionInput,
} from '@/db';

const KEY = ['sessions'] as const;

interface SessionQueryArgs {
  category?: SessionCategory;
  itemId?: string;
}

export function useSessions({ category, itemId }: SessionQueryArgs = {}) {
  return useQuery({
    queryKey: [...KEY, category, itemId],
    queryFn: () => listSessions(category, itemId),
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SessionInput) => createSession(input),
    onSuccess: (created: Session) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.setQueryData([...KEY, created.id], created);
    },
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSession(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
