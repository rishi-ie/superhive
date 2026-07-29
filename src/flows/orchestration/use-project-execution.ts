import * as React from 'react'
import type {
  ProjectExecutionSnapshot,
  ProjectPlanV1,
} from '@/orchestration/domain/entities'

interface ProjectExecutionState {
  snapshot: ProjectExecutionSnapshot | null
  plans: ProjectPlanV1[]
  loading: boolean
  error: string | null
}

export function useProjectExecution(projectId: string | null) {
  const [state, setState] = React.useState<ProjectExecutionState>({
    snapshot: null,
    plans: [],
    loading: Boolean(projectId),
    error: null,
  })

  const reload = React.useCallback(async () => {
    if (!projectId) {
      setState({ snapshot: null, plans: [], loading: false, error: null })
      return
    }
    try {
      const [snapshot, plans] = await Promise.all([
        window.api.orchestration.getProjectSnapshot(projectId),
        window.api.orchestration.listPlans(projectId),
      ])
      setState({ snapshot, plans, loading: false, error: null })
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error instanceof Error ? error.message : String(error),
      }))
    }
  }, [projectId])

  React.useEffect(() => {
    setState((current) => ({ ...current, loading: Boolean(projectId), error: null }))
    void reload()
    if (!projectId) return
    return window.api.orchestration.onProjectChanged(projectId, (snapshot) => {
      setState((current) => ({ ...current, snapshot, loading: false, error: null }))
      void window.api.orchestration.listPlans(projectId).then((plans) => {
        setState((current) => ({ ...current, plans }))
      })
    })
  }, [projectId, reload])

  const run = React.useCallback(async (
    action: () => Promise<ProjectExecutionSnapshot>,
  ) => {
    const snapshot = await action()
    setState((current) => ({ ...current, snapshot, error: null }))
    return snapshot
  }, [])

  return {
    ...state,
    reload,
    approvePlan: (planId: string) => {
      if (!projectId) return Promise.reject(new Error('Project is not selected'))
      return run(() => window.api.orchestration.approvePlan(projectId, planId))
    },
    pauseProject: () => {
      if (!projectId) return Promise.reject(new Error('Project is not selected'))
      return run(() => window.api.orchestration.pauseProject(projectId))
    },
    resumeProject: () => {
      if (!projectId) return Promise.reject(new Error('Project is not selected'))
      return run(() => window.api.orchestration.resumeProject(projectId))
    },
    cancelProject: () => {
      if (!projectId) return Promise.reject(new Error('Project is not selected'))
      return run(() => window.api.orchestration.cancelProject(projectId))
    },
  }
}

