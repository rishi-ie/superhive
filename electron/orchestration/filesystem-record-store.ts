import { mkdir, readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import type {
  IterationReviewV1,
  LoopIterationV1,
  ProjectPlanV1,
  WorkPacketV2,
  WorkerResultV1,
} from '../../src/orchestration/domain/entities'
import type { OrchestrationRecordStore } from '../../src/orchestration/ports'
import { FilesystemOrchestrationLayout } from './filesystem-layout'
import { writeJsonAtomic } from './filesystem-utils'

export class FilesystemOrchestrationRecordStore implements OrchestrationRecordStore {
  constructor(private readonly layout: FilesystemOrchestrationLayout) {}

  async writePlan(plan: ProjectPlanV1) {
    await writeJsonAtomic(join(await this.layout.plans(plan.projectId), `${plan.id}.json`), plan)
  }
  async readPlan(projectId: string, planId: string) {
    return readJson<ProjectPlanV1>(join(await this.layout.plans(projectId), `${planId}.json`))
  }
  async listPlans(projectId: string) {
    const dir = await this.layout.plans(projectId)
    try {
      const names = await readdir(dir)
      const rows = await Promise.all(names.filter((name) => name.endsWith('.json')).map((name) => readJson<ProjectPlanV1>(join(dir, name))))
      return rows.filter((row): row is ProjectPlanV1 => Boolean(row)).sort((a, b) => a.version - b.version)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
      throw error
    }
  }
  async writeIteration(iteration: LoopIterationV1) {
    await writeJsonAtomic(join(await this.iterationDir(iteration.projectId, iteration.id), 'iteration.json'), iteration)
  }
  async readIteration(projectId: string, iterationId: string) {
    return readJson<LoopIterationV1>(join(await this.iterationDir(projectId, iterationId), 'iteration.json'))
  }
  async writePacket(packet: WorkPacketV2) {
    await writeJsonAtomic(join(await this.iterationDir(packet.projectId, packet.iterationId), 'packet.json'), packet)
  }
  async readPacket(projectId: string, iterationId: string) {
    return readJson<WorkPacketV2>(join(await this.iterationDir(projectId, iterationId), 'packet.json'))
  }
  async writeResult(result: WorkerResultV1) {
    await writeJsonAtomic(join(await this.iterationDir(result.projectId, result.iterationId), 'result.json'), result)
  }
  async readResult(projectId: string, iterationId: string) {
    return readJson<WorkerResultV1>(join(await this.iterationDir(projectId, iterationId), 'result.json'))
  }
  async writeReview(review: IterationReviewV1) {
    await writeJsonAtomic(join(await this.iterationDir(review.projectId, review.iterationId), 'review.json'), review)
  }
  async readReview(projectId: string, iterationId: string) {
    return readJson<IterationReviewV1>(join(await this.iterationDir(projectId, iterationId), 'review.json'))
  }

  private async iterationDir(projectId: string, iterationId: string) {
    const path = join(await this.layout.iterations(projectId), iterationId)
    await mkdir(path, { recursive: true })
    return path
  }
}

async function readJson<T>(path: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as T
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

