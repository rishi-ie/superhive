import { ipcMain } from 'electron';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { ProjectRepository } from '../../src/storage/repositories/ProjectRepository';
import { IPC } from './index';
import type { ProjectCreateInput } from '../../src/types/electron';

export function registerProjectIpc(): void {
  ipcMain.handle(IPC.PROJECTS.LIST, () => ProjectRepository.getAll());

  ipcMain.handle(IPC.PROJECTS.GET, async (_e, id: string) => {
    return (await ProjectRepository.getById(id)) ?? null;
  });

  ipcMain.handle(
    IPC.PROJECTS.CREATE,
    async (_e, data: ProjectCreateInput) => {
      if (!data.name?.trim()) {
        throw new Error('Project name is required');
      }

      let localPath: string | undefined;
      if (data.localPath?.trim()) {
        const resolved = data.localPath.trim().replace(/^~(?=\/|$)/, process.env.HOME ?? '');
        await mkdir(resolved, { recursive: true });
        if (!existsSync(resolved)) {
          throw new Error(`Failed to create project folder: ${resolved}`);
        }
        localPath = resolved;
      }

      return ProjectRepository.create({
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        localPath,
      });
    }
  );
}
