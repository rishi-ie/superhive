import type { Agent } from '@/types/electron'
import { ProjectsSection } from './ProjectsSection'
import type { ProjectItem } from './ProjectsSection'

export function PinnedSection({ items, agents, workingIds, completedIds, pinnedProjectIds, coordinatorStates, onOpen, onToggleProjectPin }: { items: ProjectItem[]; agents: Agent[]; workingIds: Set<string>; completedIds: Set<string>; pinnedProjectIds: Set<string>; coordinatorStates: Map<string, 'working' | 'completed'>; onOpen: (id: string) => void; onToggleProjectPin: (id: string) => void }) {
  if (!items.length) return null
  return <section>
    <div className="flex h-8 w-full items-center px-row text-sm font-medium text-sidebar-projects-label-fg">Pinned</div>
    <ProjectsSection items={items} agents={agents} workingIds={workingIds} completedIds={completedIds} pinnedProjectIds={pinnedProjectIds} coordinatorStates={coordinatorStates} onOpen={onOpen} onToggleProjectPin={onToggleProjectPin} />
  </section>
}
