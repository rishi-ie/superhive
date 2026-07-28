import type { MouseEventHandler } from 'react'
import { Icon } from '@/components/ui/icon'
import { CircleNotchIcon, DotsThreeIcon, PushPinIcon, UserIcon } from '@phosphor-icons/react'

interface AgentRowProps {
  name: string
  working?: boolean
  completed?: boolean
  pinned?: boolean
  projectMember?: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>
  onPin?: () => void
  onMore?: () => void
}

export function AgentRow({ name, working = false, completed = false, pinned = false, projectMember = false, onClick, onPin, onMore }: AgentRowProps) {
  return (
    <div className="group relative flex h-8 w-full items-center rounded-card text-sm font-medium text-sidebar-btn-text-l transition-colors hover:bg-sidebar-accent-l">
      <button type="button" onClick={onClick} className="flex h-full min-w-0 flex-1 items-center gap-stack px-row text-left">
        <Icon icon={UserIcon} className="size-4 shrink-0" />
        <span className="flex-1 truncate">{name}</span>
      </button>
      <div className={`mr-2 flex size-5 shrink-0 items-center justify-center ${working ? '' : 'group-hover:hidden'}`}>
        {working ? <Icon icon={CircleNotchIcon} aria-label="Responding" weight="bold" className="size-4 animate-[spin_1.8s_linear_infinite] text-muted-foreground" /> : completed ? <span aria-label="New response" className="size-2 rounded-full bg-blue-500" /> : null}
      </div>
      <div className={`absolute right-1 hidden items-center gap-0.5 ${working ? '' : 'group-hover:flex'}`}>
        {projectMember ? <button type="button" aria-label={`More actions for ${name}`} onClick={(event) => { event.stopPropagation(); onMore?.() }} className="flex size-6 items-center justify-center rounded-icon hover:bg-sidebar-accent-l"><Icon icon={DotsThreeIcon} className="size-4" /></button> : null}
        <button type="button" aria-label={pinned ? `Unpin ${name}` : `Pin ${name}`} onClick={(event) => { event.stopPropagation(); onPin?.() }} className="flex size-6 items-center justify-center rounded-icon hover:bg-sidebar-accent-l"><Icon icon={PushPinIcon} className="size-4" weight={pinned ? 'fill' : 'regular'} /></button>
      </div>
    </div>
  )
}
