/**
 * Workspaces store — mutable list of workspaces plus active workspace tracking.
 *
 * Built-in read functions (listWorkspaces, getCurrentWorkspace) are used everywhere.
 * The createWorkspace / setCurrentWorkspace mutators are used by the setup wizards.
 */
import { mockableData } from '@/data/mock/index';
import { getInitials } from '@/lib/initials';
import type { Workspace } from './interface';

let workspaces: Workspace[] = structuredClone(mockableData.workspaces);
let currentWorkspaceId: string = mockableData.currentWorkspaceId;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 40);
}

function list(): Workspace[] {
  return workspaces;
}

function getCurrent(): Workspace | undefined {
  return workspaces.find(w => w.id === currentWorkspaceId) ?? workspaces[0];
}

function createWorkspaceImpl(input: { name: string; description?: string }): Workspace {
  const id = `ws-${slugify(input.name)}-${Date.now().toString(36)}`;
  const initials = getInitials(input.name);
  const ws: Workspace = {
    id,
    name: input.name.trim(),
    initials,
    avatarColor: 'bg-chart-1',
  };
  workspaces.push(ws);
  return ws;
}

function setCurrentWorkspaceImpl(id: string): void {
  currentWorkspaceId = id;
}

export function listWorkspaces(): Workspace[] {
  return list();
}

export function getCurrentWorkspace(): Workspace | undefined {
  return getCurrent();
}

export function createWorkspace(input: { name: string; description?: string }): Workspace {
  const ws = createWorkspaceImpl(input);
  currentWorkspaceId = ws.id;
  return ws;
}

export function setCurrentWorkspace(id: string): void {
  setCurrentWorkspaceImpl(id);
}

export type { Workspace };
