import { describe, expect, test } from 'bun:test'
import { GENERAL_WORKER_LOOP, parseWorkPacket, type WorkPacket } from './work-packet'

const packet: WorkPacket = {
	version: 1,
	projectId: 'project-1',
	taskId: 'task-1',
	coordinatorAgentId: 'coordinator-1',
	workerAgentId: 'worker-1',
	objective: 'Ship the recovery',
	deliverables: ['patch'],
	definitionOfDone: 'Tests pass',
	constraints: [],
	decisions: [],
	inputs: [],
	dependencyOutputs: [],
	reportingProtocol: 'Report in project chat',
	loop: GENERAL_WORKER_LOOP,
}

describe('parseWorkPacket', () => {
	test('accepts a complete packet bound to its assigned task and worker', () => {
		expect(parseWorkPacket(JSON.stringify(packet), 'task-1', 'project-1', 'worker-1')).toEqual(packet)
	})

	test('rejects packets that cannot safely be dispatched', () => {
		expect(parseWorkPacket(JSON.stringify({ ...packet, coordinatorAgentId: '' }), 'task-1', 'project-1', 'worker-1')).toBeNull()
		expect(parseWorkPacket(JSON.stringify({ ...packet, taskId: 'other-task' }), 'task-1', 'project-1', 'worker-1')).toBeNull()
		expect(parseWorkPacket(JSON.stringify({ ...packet, loop: ['read_context'] }), 'task-1', 'project-1', 'worker-1')).toBeNull()
	})
})
