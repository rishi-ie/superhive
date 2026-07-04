import { ipcMain } from 'electron';
import { AgentRepository } from '../../src/storage/repositories/AgentRepository';
import type { AgentStatus } from '../../src/storage/types';

export function registerAgentIpc(): void {
  ipcMain.handle('agents:list', () => AgentRepository.getAll());

  ipcMain.handle('agents:get', async (_e, id: string) => {
    return (await AgentRepository.getById(id)) ?? null;
  });

  ipcMain.handle(
    'agents:create',
    async (_e, data: { name: string; role?: string; status?: AgentStatus }) => {
      if (!data.name?.trim()) {
        throw new Error('Agent name is required');
      }
      return AgentRepository.create({
        name: data.name.trim(),
        role: data.role?.trim() || undefined,
        status: data.status ?? 'idle',
      });
    }
  );
}
