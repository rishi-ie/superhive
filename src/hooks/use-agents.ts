import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
  type Agent,
  type AgentInput,
} from '@/db';
import { log, logError } from '@/lib/logger';

const KEY = ['agents'] as const;

export function useAgents() {
  return useQuery({ queryKey: KEY, queryFn: listAgents });
}

export function useAgent(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => getAgent(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AgentInput) => {
      log('hooks', 'useCreateAgent START', input);
      return createAgent(input);
    },
    onSuccess: (created) => {
      log('hooks', 'useCreateAgent SUCCESS', { id: created.id, name: created.name });
      qc.setQueryData<Agent[]>(KEY, (old) => [...(old ?? []), created]);
      qc.setQueryData([...KEY, created.id], created);
    },
    onError: (err) => {
      logError('hooks', 'useCreateAgent ERROR', err);
    },
  });
}

export function useUpdateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<AgentInput> }) =>
      updateAgent(id, patch),
    onSuccess: (updated) => {
      if (updated) {
        qc.setQueryData<Agent[]>(KEY, (old) =>
          (old ?? []).map((a) => (a.id === updated.id ? updated : a))
        );
        qc.setQueryData([...KEY, updated.id], updated);
      }
    },
  });
}

export function useDeleteAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAgent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
