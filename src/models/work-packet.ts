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

export function parseWorkPacket(value: string | undefined, taskId: string, projectId: string, workerAgentId: string): WorkPacket | null {
  if (!value) return null
  try {
    const packet = JSON.parse(value) as Partial<WorkPacket>
    if (packet.version !== 1 || packet.taskId !== taskId || packet.projectId !== projectId || packet.workerAgentId !== workerAgentId || !packet.objective?.trim() || !packet.definitionOfDone?.trim() || !packet.reportingProtocol?.trim()) return null
    return { ...packet, deliverables: packet.deliverables ?? [], constraints: packet.constraints ?? [], decisions: packet.decisions ?? [], inputs: packet.inputs ?? [], dependencyOutputs: packet.dependencyOutputs ?? [], loop: packet.loop ?? GENERAL_WORKER_LOOP } as WorkPacket
  } catch { return null }
}
