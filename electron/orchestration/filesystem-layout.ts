import { join } from 'node:path'
import type { ProjectDirectory } from '../../src/orchestration/ports'

export class FilesystemOrchestrationLayout {
  constructor(private readonly projects: ProjectDirectory) {}

  async root(projectId: string): Promise<string> {
    const project = await this.projects.get(projectId)
    if (!project?.localPath) throw new Error(`Project ${projectId} has no local path`)
    return join(project.localPath, 'agent', 'orchestration')
  }

  async events(projectId: string) { return join(await this.root(projectId), 'events.jsonl') }
  async snapshot(projectId: string) { return join(await this.root(projectId), 'snapshot.json') }
  async policy(projectId: string) { return join(await this.root(projectId), 'policy.json') }
  async plans(projectId: string) { return join(await this.root(projectId), 'plans') }
  async iterations(projectId: string) { return join(await this.root(projectId), 'iterations') }
  async messages(projectId: string) { return join(await this.root(projectId), 'messages.jsonl') }
  async receipts(projectId: string) { return join(await this.root(projectId), 'messages', 'receipts.jsonl') }
}

