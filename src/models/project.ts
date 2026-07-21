/**
 * Project domain shapes — public surface of `src/flows/projects/`.
 */

import type { Agent, Project } from '@/storage/types'

export interface ProjectTeam {
  project: Project | null
  coordinator: Agent | null
  members: Agent[]
}

export interface DeleteProjectResult {
  ok: boolean
  error?: string
}

export interface AssignAgentInput {
  projectId: string
  agentId: string
}

export interface AssignAgentResult {
  ok: boolean
  error?: string
}

export interface RemoveAgentInput {
  projectId: string
  agentId: string
}

export interface RemoveAgentResult {
  ok: boolean
  error?: string
}

export interface PrepareProjectInput {
  name: string
  description?: string
  localPath?: string
}

export type PrepareProjectFailure =
  | { ok: false; reason: 'create-failed'; message: string }
  | { ok: false; reason: 'coordinator-create-failed'; message: string }
  | { ok: false; reason: 'coordinator-start-failed'; message: string }
  | { ok: false; reason: 'coordinator-timeout'; detail: 'runtime'; message?: string }
  | { ok: false; reason: 'coordinator-error'; message: string }
  | { ok: false; reason: 'link-failed'; message: string }

export type PrepareProjectResult =
  | { ok: true; project: Project }
  | PrepareProjectFailure

export interface RevealProjectResult {
  ok: boolean
  error?: string
}
