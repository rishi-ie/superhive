import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listProjects,
  getProject,
  createProject,
  deleteProject,
  type Project,
  type ProjectInput,
} from '@/db';

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
    mutationFn: (input: ProjectInput) => createProject(input),
    onSuccess: (created: Project) => {
      qc.setQueryData<Project[]>(KEY, (old) => [...(old ?? []), created]);
      qc.setQueryData([...KEY, created.id], created);
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
