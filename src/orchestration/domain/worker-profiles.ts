import type { WorkerProfileDefinition } from './entities'

export const generalWorkerProfile: WorkerProfileDefinition = {
  id: 'general-worker',
  version: 1,
  label: 'General worker',
  extensions: [
    'superhive-pi-orchestration',
    'superhive-pi-telemetry',
    'superhive-pi-truth',
  ],
  systemPromptFragment: 'Complete one bounded Project Agent assignment at a time.',
  supportedMessageKinds: [
    'conversation',
    'question',
    'answer',
    'progress',
    'result',
    'status',
  ],
  canReceiveWork: true,
}

