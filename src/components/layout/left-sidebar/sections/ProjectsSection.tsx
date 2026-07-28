import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from "@/components/ui/icon";
import { CircleNotchIcon, CopyIcon, FolderOpenIcon, ProhibitIcon, PushPinIcon, TextOutdentIcon, UserIcon } from '@phosphor-icons/react';
import { HugeIcon } from '@/components/ui/huge-icon';
import { EllipsisIcon, Folder01Icon, Folder02Icon } from '@hugeicons/core-free-icons';
import { AccordionSection } from '@/components/layout/common/primitives';
import { AgentRow } from '@/components/layout/common/primitives/AgentRow';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '@/components/ui/context-menu';
import { UnassignAgentDialog } from '@/components/layout/right-sidebar/sections/UnassignAgentDialog';
import { revealAgent } from '@/flows/agents/crud';
import { goToAgent, goToProject } from '@/flows/navigation';
import { removeAgentFromProject, revealProject } from '@/flows/projects/crud';
import { copyAgentId, copyProjectId } from '@/flows/ui';
import type { Agent } from '@/types/electron';

export interface ProjectItem {
  id: string;
  name: string;
  localPath?: string;
  agentIds: string[];
}

const menuContentClass = 'w-52 rounded-xl border border-foreground/25 bg-sidebar-bg p-1 font-sans text-sm text-modal-foreground shadow-md shadow-black/25 ring-0 [&_svg]:size-3.5';
const menuItemClass = 'min-h-7 gap-stack rounded-lg px-row py-1 text-sm text-modal-foreground hover:!bg-sidebar-accent-l';

function openMenuAtPointer(event: React.MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: event.clientX, clientY: event.clientY }));
}

function openCardMenuAtPointer(event: React.MouseEvent<HTMLElement>) {
  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.querySelector<HTMLButtonElement>('[data-sidebar-overflow-trigger]')?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: event.clientX, clientY: event.clientY }));
}

function SidebarOverflowMenu({ label, children }: { label: string; children: React.ReactNode }) {
  return <ContextMenu><ContextMenuTrigger asChild><button type="button" data-sidebar-overflow-trigger aria-label={label} onClick={openMenuAtPointer} className="flex size-6 cursor-default items-center justify-center rounded-icon text-muted-foreground/60 transition-colors hover:text-foreground"><HugeIcon icon={EllipsisIcon} size={16} className="size-4" /></button></ContextMenuTrigger><ContextMenuContent className={menuContentClass}>{children}</ContextMenuContent></ContextMenu>
}

interface ProjectsSectionProps {
  items: ProjectItem[];
  agents: Agent[];
  workingIds: Set<string>;
  completedIds: Set<string>;
  pinnedProjectIds: Set<string>;
  coordinatorStates: Map<string, 'working' | 'completed'>;
  onOpen: (id: string) => void;
  onToggleProjectPin: (id: string) => void;
}

export function ProjectsSection({ items, agents, workingIds, completedIds, pinnedProjectIds, coordinatorStates, onOpen, onToggleProjectPin }: ProjectsSectionProps) {
  const navigate = useNavigate();
  const [agentToRemove, setAgentToRemove] = React.useState<{ agent: Agent; projectId: string } | null>(null);

  return (
    <>
      {items.map((p) => {
        const assignedAgents = agents.filter(
          (a) => p.agentIds.includes(a.id) && a.agentKind !== 'project-coordinator'
        );
        const coordinator = agents.find((agent) => p.agentIds.includes(agent.id) && agent.agentKind === 'project-coordinator')
        const coordinatorState = coordinator ? coordinatorStates.get(coordinator.id) : undefined

          return (
            <AccordionSection
              key={p.id}
              label={p.name}
              defaultOpen={false}
              labelClassName="font-medium text-sidebar-btn-text-l"
              leadingIcon={<HugeIcon icon={Folder01Icon} size={16} className="size-4" />}
              openLeadingIcon={<HugeIcon icon={Folder02Icon} size={16} className="size-4" />}
              trailing={coordinatorState === 'working' ? <Icon icon={CircleNotchIcon} weight="bold" className="size-4 animate-[spin_1.8s_linear_infinite] text-muted-foreground" /> : coordinatorState === 'completed' ? <span className="size-2 rounded-full bg-blue-500" /> : null}
              onContextMenu={openCardMenuAtPointer}
              hoverActions={coordinatorState !== 'working' ? <><SidebarOverflowMenu label={`Actions for ${p.name}`}><ContextMenuItem className={menuItemClass} onSelect={() => goToProject(navigate, p.id)}><Icon icon={TextOutdentIcon} className="size-4 text-modal-foreground/60" />Open project</ContextMenuItem><ContextMenuSeparator className="mx-0 bg-border/50" /><ContextMenuItem className={menuItemClass} onSelect={() => { void copyProjectId(p.id) }}><Icon icon={CopyIcon} className="size-4 text-modal-foreground/60" />Copy project ID</ContextMenuItem><ContextMenuItem disabled={!p.localPath} className={menuItemClass} onSelect={() => { void revealProject(p.id) }}><Icon icon={FolderOpenIcon} className="size-4 text-modal-foreground/60" />Reveal in Finder</ContextMenuItem></SidebarOverflowMenu><button type="button" aria-label={pinnedProjectIds.has(p.id) ? `Unpin ${p.name}` : `Pin ${p.name}`} onClick={(event) => { event.stopPropagation(); onToggleProjectPin(p.id) }} className="flex size-6 cursor-default items-center justify-center rounded-icon text-muted-foreground/60 transition-colors hover:text-foreground"><Icon icon={PushPinIcon} className="size-4" weight={pinnedProjectIds.has(p.id) ? 'fill' : 'regular'} /></button></> : undefined}
              onClick={() => goToProject(navigate, p.id)}
            >
            {assignedAgents.length > 0 ? (
              assignedAgents.map((a) => (
                <AgentRow
                  key={a.id}
                  name={a.name}
                  working={workingIds.has(a.id)}
                  completed={completedIds.has(a.id)}
                  onClick={() => { onOpen(a.id); goToAgent(navigate, a.id) }}
                  onContextMenu={openCardMenuAtPointer}
                  actions={<SidebarOverflowMenu label={`Actions for ${a.name}`}><ContextMenuItem className={menuItemClass} onSelect={() => { onOpen(a.id); goToAgent(navigate, a.id) }}><Icon icon={TextOutdentIcon} className="size-4 text-modal-foreground/60" />Open chat</ContextMenuItem><ContextMenuSeparator className="mx-0 bg-border/50" /><ContextMenuItem className={menuItemClass} onSelect={() => setAgentToRemove({ agent: a, projectId: p.id })}><Icon icon={ProhibitIcon} className="size-4 text-modal-foreground/60" />Remove from project</ContextMenuItem><ContextMenuSeparator className="mx-0 bg-border/50" /><ContextMenuItem className={menuItemClass} onSelect={() => { void copyAgentId(a.id) }}><Icon icon={CopyIcon} className="size-4 text-modal-foreground/60" />Copy agent ID</ContextMenuItem><ContextMenuItem disabled={!a.localPath} className={menuItemClass} onSelect={() => { void revealAgent(a.id) }}><Icon icon={FolderOpenIcon} className="size-4 text-modal-foreground/60" />Reveal in Finder</ContextMenuItem></SidebarOverflowMenu>}
                />
              ))
            ) : (
              <div className="flex items-center gap-stack px-row py-1.5">
                <Icon icon={UserIcon} className="size-4 flex-shrink-0 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">No assigned agents</span>
              </div>
            )}
          </AccordionSection>
        );
      })}
      <UnassignAgentDialog open={Boolean(agentToRemove)} agentName={agentToRemove?.agent.name ?? null} onCancel={() => setAgentToRemove(null)} onConfirm={() => { const target = agentToRemove; if (!target) return; void removeAgentFromProject({ projectId: target.projectId, agentId: target.agent.id }).then(() => setAgentToRemove(null)); }} />
    </>
  );
}
