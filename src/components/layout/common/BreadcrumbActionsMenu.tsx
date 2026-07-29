import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CopyIcon,
  FolderOpenIcon,
  LinkIcon,
  ProhibitIcon,
  PushPinIcon,
  TextOutdentIcon,
} from '@phosphor-icons/react'
import { EllipsisIcon } from '@hugeicons/core-free-icons'
import { HugeIcon } from '@/components/ui/huge-icon'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AgentAssignToProjectDialog } from '@/pages/agent-chat/components/AgentAssignToProjectDialog'
import { UnassignAgentDialog } from '@/components/layout/right-sidebar/sections/UnassignAgentDialog'
import { revealAgent } from '@/flows/agents/crud'
import {
  assignAgentToProject,
  removeAgentFromProject,
  revealProject,
} from '@/flows/projects/crud'
import { usePinnedProjects } from '@/flows/projects/ui'
import { copyAgentId, copyProjectId } from '@/flows/ui'
import { goToProject } from '@/flows/navigation'
import type { BreadcrumbEntityContext } from '@/models/ui'
import type { Project } from '@/types/electron'
import {
  deriveAgentBreadcrumbRelations,
  deriveProjectBreadcrumbUtilities,
} from './breadcrumb-actions'

const menuClass = 'min-w-56 border-border bg-modal text-modal-foreground shadow-lg shadow-black/20'
const itemClass = 'min-h-8 gap-2 rounded-lg px-2 text-modal-foreground hover:!bg-sidebar-accent-l'

interface BreadcrumbActionsMenuProps {
  context: BreadcrumbEntityContext | null
  label: string
}

export function BreadcrumbActionsMenu({ context, label }: BreadcrumbActionsMenuProps) {
  const navigate = useNavigate()
  const { pinnedProjectIds, toggleProjectPin } = usePinnedProjects()
  const [assignOpen, setAssignOpen] = React.useState(false)
  const [removalProject, setRemovalProject] = React.useState<Project | null>(null)

  if (!context) {
    return (
      <button
        type="button"
        disabled
        aria-label={`Actions for ${label}`}
        className="flex size-7 cursor-default items-center justify-center rounded-lg text-muted-foreground opacity-50"
      >
        <HugeIcon icon={EllipsisIcon} size={16} className="size-4" aria-hidden="true" />
      </button>
    )
  }

  const trigger = (
    <button
      type="button"
      aria-label={`Actions for ${label}`}
      className="flex size-7 cursor-default items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <HugeIcon icon={EllipsisIcon} size={16} className="size-4" aria-hidden="true" />
    </button>
  )

  if (context.kind === 'project') {
    const { project } = context
    const utilities = deriveProjectBreadcrumbUtilities(project, pinnedProjectIds)
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent align="start" className={menuClass}>
          <DropdownMenuItem
            className={itemClass}
            onSelect={() => toggleProjectPin(project.id)}
          >
            <PushPinIcon weight={utilities.pinned ? 'fill' : 'regular'} />
            {utilities.pinned ? 'Unpin project' : 'Pin project'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className={itemClass}
            onSelect={() => { void copyProjectId(project.id) }}
          >
            <CopyIcon /> Copy project ID
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!utilities.canReveal}
            className={itemClass}
            onSelect={() => { void revealProject(project.id) }}
          >
            <FolderOpenIcon /> Reveal in Finder
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const { agent, projects } = context
  const relations = deriveAgentBreadcrumbRelations(agent, projects)
  const scheduleRemoval = (project: Project) => {
    requestAnimationFrame(() => setRemovalProject(project))
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent align="start" className={menuClass}>
          {agent.agentKind === 'project-coordinator' ? (
            <DropdownMenuItem
              disabled={!relations.ownerProject}
              className={itemClass}
              onSelect={() => {
                if (relations.ownerProject) goToProject(navigate, relations.ownerProject.id)
              }}
            >
              <TextOutdentIcon /> Open project
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem
                disabled={relations.availableProjects.length === 0}
                className={itemClass}
                onSelect={() => requestAnimationFrame(() => setAssignOpen(true))}
              >
                <LinkIcon /> Add to project…
              </DropdownMenuItem>
              {relations.assignedProjects.length > 1 ? (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className={itemClass}>
                    <ProhibitIcon /> Remove from project…
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className={menuClass}>
                    {relations.assignedProjects.map((project) => (
                      <DropdownMenuItem
                        key={project.id}
                        className={itemClass}
                        onSelect={() => scheduleRemoval(project)}
                      >
                        {project.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ) : (
                <DropdownMenuItem
                  disabled={relations.assignedProjects.length === 0}
                  className={itemClass}
                  onSelect={() => {
                    const project = relations.assignedProjects[0]
                    if (project) scheduleRemoval(project)
                  }}
                >
                  <ProhibitIcon /> Remove from project…
                </DropdownMenuItem>
              )}
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className={itemClass}
            onSelect={() => { void copyAgentId(agent.id) }}
          >
            <CopyIcon /> Copy agent ID
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!relations.canReveal}
            className={itemClass}
            onSelect={() => { void revealAgent(agent.id) }}
          >
            <FolderOpenIcon /> Reveal in Finder
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {agent.agentKind !== 'project-coordinator' ? (
        <AgentAssignToProjectDialog
          open={assignOpen}
          agentId={agent.id}
          onOpenChange={setAssignOpen}
          excludeProjectIds={agent.projectIds}
          loadProjects={async () => relations.availableProjects.map(
            (project) => ({ id: project.id, name: project.name }),
          )}
          onSelect={(projectId) => assignAgentToProject({ projectId, agentId: agent.id })}
        />
      ) : null}

      <UnassignAgentDialog
        open={Boolean(removalProject)}
        agentName={agent.name}
        onCancel={() => setRemovalProject(null)}
        onConfirm={() => {
          const project = removalProject
          if (!project) return
          void removeAgentFromProject({ projectId: project.id, agentId: agent.id })
            .then(() => setRemovalProject(null))
        }}
      />
    </>
  )
}
