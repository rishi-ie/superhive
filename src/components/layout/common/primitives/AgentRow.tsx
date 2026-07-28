import type { MouseEventHandler } from 'react'
import { Icon } from '@/components/ui/icon'
import { CircleNotchIcon, UserIcon } from '@phosphor-icons/react'
import { HugeIcon } from '@/components/ui/huge-icon'
import { EllipsisIcon } from '@hugeicons/core-free-icons'

interface AgentRowProps {
  name: string
  working?: boolean
  completed?: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>
  onMore?: () => void
}

export function AgentRow({ name, working = false, completed = false, onClick, onMore }: AgentRowProps) {
  return (
    <div className="group/agent relative flex h-8 w-full items-center rounded-card text-sm font-medium text-sidebar-btn-text-l transition-colors hover:bg-sidebar-accent-l">
      <button type="button" onClick={onClick} className="flex h-full min-w-0 flex-1 items-center gap-stack px-row text-left">
        <Icon icon={UserIcon} className="size-4 shrink-0" />
        <span className="flex-1 truncate">{name}</span>
      </button>
      <div className={`mr-2 flex size-5 shrink-0 items-center justify-center ${working ? '' : 'group-hover/agent:hidden'}`}>
        {working ? <Icon icon={CircleNotchIcon} aria-label="Responding" weight="bold" className="size-4 animate-[spin_1.8s_linear_infinite] text-muted-foreground" /> : completed ? <span aria-label="New response" className="size-2 rounded-full bg-blue-500" /> : null}
      </div>
      {onMore && <div className={`absolute right-1 hidden items-center ${working ? '' : 'group-hover/agent:flex'}`}><button type="button" aria-label={`More actions for ${name}`} onClick={(event) => { event.stopPropagation(); onMore() }} className="flex size-6 cursor-default items-center justify-center rounded-icon text-muted-foreground/60 transition-colors hover:text-foreground"><HugeIcon icon={EllipsisIcon} size={16} className="size-4" /></button></div>}
    </div>
  )
}
