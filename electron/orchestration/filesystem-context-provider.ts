import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type {
  ContextReference,
  ContextSlice,
  CoordinatorContextRequest,
  PacketContext,
  ProjectAgentDirectory,
  ProjectContextProvider,
  WorkerContextRequest,
} from '../../src/orchestration/ports'

interface ContextIndex {
  entries?: Array<{
    nodeId?: string
    kind?: string
    ref?: string
  }>
}

export class FilesystemProjectContextProvider implements ProjectContextProvider {
  constructor(private readonly agents: ProjectAgentDirectory) {}

  async getCoordinatorContext(input: CoordinatorContextRequest): Promise<ContextSlice> {
    const nodes = await this.matchingNodes(input.coordinatorAgentId, input.references)
    const texts = await Promise.all(nodes.map((path) => readFile(path, 'utf8').catch(() => '')))
    return {
      text: texts.filter(Boolean).join('\n\n'),
      references: input.references,
    }
  }

  async getWorkerPacketContext(input: WorkerContextRequest): Promise<PacketContext> {
    const nodes = await this.matchingNodes(input.coordinatorAgentId, input.references)
    return {
      inputs: nodes.map((path, index) => ({
        kind: 'note' as const,
        ref: path,
        label: `Relevant compacted project context ${index + 1}`,
      })),
    }
  }

  private async matchingNodes(
    coordinatorAgentId: string,
    references: ContextReference[],
  ): Promise<string[]> {
    const coordinator = await this.agents.get(coordinatorAgentId)
    if (!coordinator?.localPath) return []
    try {
      const index = JSON.parse(
        await readFile(join(coordinator.localPath, 'context', 'index.json'), 'utf8'),
      ) as ContextIndex
      const wanted = new Set(references.map((reference) => `${reference.kind}:${reference.ref}`))
      const nodeIds = [...new Set(
        (index.entries ?? [])
          .filter((entry) => wanted.has(`${entry.kind}:${entry.ref}`))
          .map((entry) => entry.nodeId)
          .filter((nodeId): nodeId is string => Boolean(nodeId)),
      )].slice(-5)
      return nodeIds.map((nodeId) =>
        join(coordinator.localPath, 'context', 'nodes', `${nodeId}.md`))
    } catch {
      return []
    }
  }
}

