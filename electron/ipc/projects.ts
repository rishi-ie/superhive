import { ipcMain } from 'electron';
import { ProjectRepository } from '../../src/storage/repositories/ProjectRepository';
import { IPC } from './index';

export function registerProjectIpc(): void {
  ipcMain.handle(IPC.PROJECTS.LIST, () => ProjectRepository.getAll());

  ipcMain.handle(IPC.PROJECTS.GET, async (_e, id: string) => {
    return (await ProjectRepository.getById(id)) ?? null;
  });

  ipcMain.handle(
    IPC.PROJECTS.CREATE,
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
