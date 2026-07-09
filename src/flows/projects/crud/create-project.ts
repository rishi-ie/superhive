import { projects } from '@/api/projects';
import { agents } from '@/api/agents';
import { toast } from 'sonner';
import type { Project } from '@/storage/types';
import { createProjectAgent } from '@/flows/agents/crud/create-project-agent';
import { createChannel } from '@/flows/channels/crud/create-channel';

export interface CreateProjectInput {
	name: string;
	description?: string;
	localPath?: string;
}

export interface CreateProjectResult {
  ok: boolean;
  project?: Project;
  error?: string;
}

export async function createProject(input: CreateProjectInput): Promise<CreateProjectResult> {
	const name = input.name?.trim();
	const description = input.description?.trim();
	const localPath = input.localPath?.trim();

	if (!name) {
		toast.error('Project name is required');
		return { ok: false, error: 'Project name is required' };
	}

	// Step 1: Create the project
	let project: Project;
	try {
		project = await projects.create({
			name,
			description: description || undefined,
			localPath: localPath || undefined,
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to create project';
		toast.error(message);
		return { ok: false, error: message };
	}

	// Step 2: Create the project-agent inside the project's folder
	const agentResult = await createProjectAgent({
		name: `${name} (Coordinator)`,
		folderName: 'agent',
		parentDir: localPath ?? `~/.superhive/projects/${name.toLowerCase().replace(/\s+/g, '-')}`,
	});
	if (!agentResult.ok || !agentResult.agent) {
		await projects.delete(project.id).catch(() => {});
		return { ok: false, error: agentResult.error ?? 'Failed to create project agent', project };
	}
	const projectAgent = agentResult.agent;

	// Step 2.5: Link project-agent to project (both directions via ProjectRepository.addAgent)
	try {
		await projects.addAgent(project.id, projectAgent.id);
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to link project agent';
		toast.error(message);
		await projects.delete(project.id).catch(() => {});
		await agents.delete(projectAgent.id).catch(() => {});
		return { ok: false, error: message, project };
	}

	// Step 3: Create the channel (record-only; runtime drives messaging now)
	const channelResult = await createChannel({
		name: `${name} coordination`,
		type: 'project',
		projectId: project.id,
		participantAgentIds: [projectAgent.id],
	});
	if (!channelResult.ok || !channelResult.channel) {
		await projects.delete(project.id).catch(() => {});
		await agents.delete(projectAgent.id).catch(() => {});
		return { ok: false, error: channelResult.error ?? 'Failed to create channel', project };
	}
	const channel = channelResult.channel;

	// Step 4: Link channel to project (for future L3 multi-agent routing)
	try {
		await window.api.projects.update(project.id, { channelId: channel.id });
	} catch {
		// Non-fatal — channel exists independently
	}

	toast.success(`Project "${project.name}" created`);
	return { ok: true, project };
}