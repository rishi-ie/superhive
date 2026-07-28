import { useNavigate } from 'react-router-dom'
import { AccordionSection } from '@/components/layout/common/primitives'
import { AgentRow } from '@/components/layout/common/primitives/AgentRow'
import { goToAgent } from '@/flows/navigation'
import type { Agent } from '@/types/electron'

export function PinnedSection({ items, workingIds, completedIds, onOpen, onTogglePin }: { items: Agent[]; workingIds: Set<string>; completedIds: Set<string>; onOpen: (id: string) => void; onTogglePin: (id: string) => void }) {
  const navigate = useNavigate()
  if (!items.length) return null
  return <AccordionSection label="Pinned">{items.map((agent) => <AgentRow key={agent.id} name={agent.name} working={workingIds.has(agent.id)} completed={completedIds.has(agent.id)} pinned onClick={() => { onOpen(agent.id); goToAgent(navigate, agent.id) }} onPin={() => onTogglePin(agent.id)} />)}</AccordionSection>
}
