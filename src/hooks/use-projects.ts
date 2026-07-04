import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listProjects,
  getProject,
  createProject,
  deleteProject,
  type Project,
  type ProjectInput,
} from '@/db';
import { log, logError } from '@/lib/logger';

const KEY = ['projects'] as const;

export function useProjects() {
  return useQuery({ queryKey: KEY, queryFn: listProjects });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => getProject(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProjectInput) => {
      log('hooks', 'useCreateProject START', input);
      return createProject(input);
    },
    onSuccess: (created) => {
      log('hooks', 'useCreateProject SUCCESS', { id: created.id, name: created.name });
      qc.setQueryData<Project[]>(KEY, (old) => [...(old ?? []), created]);
      qc.setQueryData([...KEY, created.id], created);
    },
    onError: (err) => {
      logError('hooks', 'useCreateProject ERROR', err);
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
