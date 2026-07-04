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
    mutationFn: (input: AgentInput) => createAgent(input),
    onSuccess: (created: Agent) => {
      qc.setQueryData<Agent[]>(KEY, (old) => [...(old ?? []), created]);
      qc.setQueryData([...KEY, created.id], created);
    },
  });
}

export function useUpdateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<AgentInput> }) =>
      updateAgent(id, patch),
    onSuccess: (updated: Agent | null) => {
      qc.invalidateQueries({ queryKey: KEY });
      if (updated) qc.setQueryData([...KEY, updated.id], updated);
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
