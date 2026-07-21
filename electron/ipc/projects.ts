import { ipcMain } from 'electron';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { ProjectRepository } from '../../src/storage/repositories/ProjectRepository';
import { AgentRepository } from '../../src/storage/repositories/AgentRepository';
import { agentsFsWatcher } from '../agents-fs-watcher';
import { IPC } from './index';
import { revealProjectInFinder } from './reveal-project';
import { patchCoordinatorForMemberStatus } from '../project-status-mirror';
import { getTopEnabledModel } from '../get-top-enabled-model';
import { readFileSync } from 'node:fs';
import { writeFile, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { settingsFilePathFor } from '../agent-settings-defaults';
import log from 'electron-log/main';
import type { ProjectCreateInput, ProjectUpdateInput } from '../../src/types/electron';

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

      const created = await ProjectRepository.create({
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        localPath,
      });
      agentsFsWatcher.notifyProjectsChanged();
      return created;
    }
  );

  ipcMain.handle(IPC.PROJECTS.UPDATE, async (_e, id: string, data: ProjectUpdateInput) => {
    const updated = await ProjectRepository.update(id, data);
    agentsFsWatcher.notifyProjectsChanged();
    return updated;
  });

  ipcMain.handle(IPC.PROJECTS.DELETE, async (_e, id: string) => {
    const ok = await ProjectRepository.delete(id);
    agentsFsWatcher.notifyProjectsChanged();
    return ok;
  });

  ipcMain.handle(IPC.PROJECTS.ADD_AGENT, async (_e, projectId: string, agentId: string) => {
    await ProjectRepository.addAgent(projectId, agentId);
    // Gap 1: populate the coordinator's truth file `project.members[]`
    // so the orchestration extension sees this agent on the next
    // session_start (or immediately, if the coordinator is running).
    await addMemberToCoordinatorRoster(projectId, agentId);
    agentsFsWatcher.notifyProjectsChanged();
  });

  ipcMain.handle(IPC.PROJECTS.REMOVE_AGENT, async (_e, projectId: string, agentId: string) => {
    await ProjectRepository.removeAgent(projectId, agentId);
    // Gap 1: drop the member from the coordinator's truth file roster.
    await removeMemberFromCoordinatorRoster(projectId, agentId);
    agentsFsWatcher.notifyProjectsChanged();
  });

  ipcMain.handle(IPC.PROJECTS.REVEAL, async (_e, projectId: string) => {
    return revealProjectInFinder(projectId);
  });
}

// ---------------------------------------------------------------------------
// Gap 1: roster sync helpers
// ---------------------------------------------------------------------------

/**
 * Append a member to the coordinator's truth file `project.members[]`.
 * Idempotent. No-ops silently when the project has no coordinator yet
 * (which is fine — coordinators are usually created before members).
 */
async function addMemberToCoordinatorRoster(projectId: string, agentId: string): Promise<void> {
  const member = await AgentRepository.getById(agentId);
  if (!member) return;

  const allInProject = await AgentRepository.getByProject(projectId);
  const coordinator = allInProject.find((a) => a.agentKind === 'project-coordinator');
  if (!coordinator?.localPath) return;

  const settingsPath = settingsFilePathFor(coordinator.localPath);
  if (!existsSync(settingsPath)) {
    log.warn(`[projects:addAgent] coordinator settings missing at ${settingsPath}`);
    return;
  }

  try {
    const raw = readFileSync(settingsPath, 'utf8');
    const settings = JSON.parse(raw) as {
      managedBy?: string;
      project?: { id: string; members: Array<{ agentId: string; [k: string]: unknown }> };
    };
    if (!settings.project) return;
    if (settings.project.members.some((m) => m.agentId === agentId)) return;

    const topModel = await getTopEnabledModel().catch(() => null);

    settings.project.members.push({
      agentId: member.id,
      name: member.name,
      role: member.role,
      model: topModel
        ? { provider: topModel.provider, name: topModel.name }
        : undefined,
      status: member.status ?? 'idle',
      joinedAt: new Date().toISOString(),
    });

    const counter = parseCounter(settings.managedBy) + 1;
    settings.managedBy = `superhive-pi-truth@1#${counter}`;
    (settings as { lastModified?: string }).lastModified = new Date().toISOString();

    const serialized = JSON.stringify(settings, null, '\t') + '\n';
    const tmp = `${settingsPath}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(tmp, serialized, 'utf8');
    await rename(tmp, settingsPath);
  } catch (err) {
    log.error(
      `[projects:addAgent] failed to patch coordinator roster: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

/**
 * Drop a member from the coordinator's truth file `project.members[]`.
 * Idempotent. No-op when the project has no coordinator or the member
 * is not on the roster.
 */
async function removeMemberFromCoordinatorRoster(projectId: string, agentId: string): Promise<void> {
  const allInProject = await AgentRepository.getByProject(projectId);
  const coordinator = allInProject.find((a) => a.agentKind === 'project-coordinator');
  if (!coordinator?.localPath) return;

  const settingsPath = settingsFilePathFor(coordinator.localPath);
  if (!existsSync(settingsPath)) return;

  try {
    const raw = readFileSync(settingsPath, 'utf8');
    const settings = JSON.parse(raw) as {
      managedBy?: string;
      project?: { id: string; members: Array<{ agentId: string; [k: string]: unknown }> };
    };
    if (!settings.project) return;

    const before = settings.project.members.length;
    settings.project.members = settings.project.members.filter((m) => m.agentId !== agentId);
    if (settings.project.members.length === before) return;

    const counter = parseCounter(settings.managedBy) + 1;
    settings.managedBy = `superhive-pi-truth@1#${counter}`;
    (settings as { lastModified?: string }).lastModified = new Date().toISOString();

    const serialized = JSON.stringify(settings, null, '\t') + '\n';
    const tmp = `${settingsPath}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(tmp, serialized, 'utf8');
    await rename(tmp, settingsPath);
  } catch (err) {
    log.error(
      `[projects:removeAgent] failed to patch coordinator roster: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

function parseCounter(managedBy: string | undefined): number {
  if (!managedBy) return 0;
  const idx = managedBy.indexOf('#');
  if (idx === -1) return 0;
  const n = Number.parseInt(managedBy.slice(idx + 1), 10);
  return Number.isFinite(n) ? n : 0;
}

void patchCoordinatorForMemberStatus;
void join;
void writeFile;
void rename;
