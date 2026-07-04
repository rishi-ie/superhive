import { ipcMain } from 'electron';
import { ProjectRepository } from '../../src/storage/repositories/ProjectRepository';

export function registerProjectIpc(): void {
  ipcMain.handle('projects:list', () => ProjectRepository.getAll());

  ipcMain.handle('projects:get', async (_e, id: string) => {
    return (await ProjectRepository.getById(id)) ?? null;
  });

  ipcMain.handle(
    'projects:create',
    async (_e, data: { name: string; description?: string }) => {
      if (!data.name?.trim()) {
        throw new Error('Project name is required');
      }
      return ProjectRepository.create({
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
      });
    }
  );
}
