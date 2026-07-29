import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type {
  ProjectExecutionSnapshot,
  ProjectPlanV1,
} from '@/orchestration/domain/entities'

interface ProjectPlanApprovalProps {
  snapshot: ProjectExecutionSnapshot | null
  plans: ProjectPlanV1[]
  onApprove: (planId: string) => Promise<unknown>
}

export function ProjectPlanApproval({
  snapshot,
  plans,
  onApprove,
}: ProjectPlanApprovalProps) {
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const plan = plans.find((candidate) => candidate.id === snapshot?.activePlanId)

  if (!plan || snapshot?.state !== 'awaiting_approval') return null

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-2 sm:px-6">
      <Card size="sm">
        <CardHeader className="grid-cols-[1fr_auto]">
          <div>
            <CardTitle>Plan v{plan.version}: {plan.goal}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">{plan.summary}</p>
          </div>
          <Badge variant="outline">{plan.tasks.length} tasks</Badge>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col gap-1 text-xs text-muted-foreground">
            {plan.tasks.map((task) => (
              <li key={task.id}>
                <span className="text-foreground/80">{task.title}</span>
                {task.dependencies.length > 0
                  ? ` · after ${task.dependencies.join(', ')}`
                  : ''}
              </li>
            ))}
          </ol>
          {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
        </CardContent>
        <CardFooter className="justify-end">
          <Button
            disabled={submitting}
            onClick={() => {
              setSubmitting(true)
              setError(null)
              void onApprove(plan.id)
                .catch((cause) => setError(cause instanceof Error ? cause.message : String(cause)))
                .finally(() => setSubmitting(false))
            }}
          >
            {submitting ? 'Starting…' : 'Approve and start'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

