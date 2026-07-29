import type { ComponentType } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type {
  ProjectChannelMessage,
  ProjectMessageKind,
} from '@/orchestration/domain/entities'

export interface ProjectMessageRendererProps {
  message: ProjectChannelMessage
}

function actorLabel(message: ProjectChannelMessage): string {
  const recipients = message.recipients.map((recipient) => recipient.displayName).join(', ')
  return recipients
    ? `${message.actor.displayName} → ${recipients}`
    : message.actor.displayName
}

function MessageCard({
  message,
  label,
}: ProjectMessageRendererProps & { label: string }) {
  return (
    <Card size="sm" className="bg-card/70">
      <CardHeader className="grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <CardTitle className="truncate">{actorLabel(message)}</CardTitle>
          <p className="text-[0.625rem] text-muted-foreground">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <Badge variant="outline">{label}</Badge>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap break-words text-sm text-foreground/90">
          {message.text}
        </p>
        {message.taskId || message.iterationId ? (
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[0.625rem] text-muted-foreground">
            {message.taskId ? <span>Task: {message.taskId}</span> : null}
            {message.iterationId ? <span>Iteration: {message.iterationId}</span> : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function renderer(label: string): ComponentType<ProjectMessageRendererProps> {
  return function RegisteredMessageRenderer(props) {
    return <MessageCard {...props} label={label} />
  }
}

export class ProjectMessageRendererRegistry {
  private readonly renderers = new Map<
    ProjectMessageKind,
    ComponentType<ProjectMessageRendererProps>
  >()

  register(
    kind: ProjectMessageKind,
    component: ComponentType<ProjectMessageRendererProps>,
  ): void {
    this.renderers.set(kind, component)
  }

  get(kind: ProjectMessageKind): ComponentType<ProjectMessageRendererProps> | undefined {
    return this.renderers.get(kind)
  }
}

export const projectMessageRenderers = new ProjectMessageRendererRegistry()
projectMessageRenderers.register('conversation', renderer('Discussion'))
projectMessageRenderers.register('handoff', renderer('Handoff'))
projectMessageRenderers.register('question', renderer('Question'))
projectMessageRenderers.register('answer', renderer('Answer'))
projectMessageRenderers.register('progress', renderer('Progress'))
projectMessageRenderers.register('result', renderer('Result'))
projectMessageRenderers.register('review', renderer('Review'))
projectMessageRenderers.register('status', renderer('Status'))

export function ProjectChannelMessageCard({ message }: ProjectMessageRendererProps) {
  const Renderer = projectMessageRenderers.get(message.kind)
  return Renderer
    ? <Renderer message={message} />
    : <MessageCard message={message} label={message.kind || 'Update'} />
}
