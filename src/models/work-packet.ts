export const GENERAL_WORKER_LOOP = [
  'read_context', 'execute_assignment', 'verify_output',
  'report_progress_or_result', 'ask_coordinator_if_blocked', 'wait_for_next_assignment',
] as const

export interface WorkPacket {
  version: 1
  projectId: string
  taskId: string
  coordinatorAgentId: string
  workerAgentId: string
  objective: string
  deliverables: string[]
  definitionOfDone: string
  constraints: string[]
  decisions: string[]
  inputs: string[]
  dependencyOutputs: string[]
  reportingProtocol: string
  loop: readonly string[]
}

function stringList(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : null
}

export function parseWorkPacket(value: string | undefined, taskId: string, projectId: string, workerAgentId: string): WorkPacket | null {
  if (!value) return null
  try {
    const packet = JSON.parse(value) as Partial<WorkPacket>
    if (packet.version !== 1 || packet.taskId !== taskId || packet.projectId !== projectId || packet.workerAgentId !== workerAgentId || typeof packet.coordinatorAgentId !== 'string' || !packet.coordinatorAgentId.trim() || !packet.objective?.trim() || !packet.definitionOfDone?.trim() || !packet.reportingProtocol?.trim()) return null
    const deliverables = stringList(packet.deliverables)
    const constraints = stringList(packet.constraints)
    const decisions = stringList(packet.decisions)
    const inputs = stringList(packet.inputs)
    const dependencyOutputs = stringList(packet.dependencyOutputs)
    const loop = stringList(packet.loop)
    if (!deliverables || !constraints || !decisions || !inputs || !dependencyOutputs || !loop || loop.length !== GENERAL_WORKER_LOOP.length || loop.some((step, index) => step !== GENERAL_WORKER_LOOP[index])) return null
    return { ...packet, deliverables, constraints, decisions, inputs, dependencyOutputs, loop } as WorkPacket
  } catch { return null }
}
