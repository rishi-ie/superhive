import * as React from 'react'
import { ArrowUpIcon, PlusIcon, Stop, XIcon } from '@phosphor-icons/react'
import { Icon } from '@/components/ui/icon'
import { HugeIcon } from '@/components/ui/huge-icon'
import { Mic02Icon } from '@hugeicons/core-free-icons'
import { ModelPicker } from '@/components/layout/composer/ModelPicker'
import { ContextUsageRing } from '@/components/layout/composer/ContextUsageRing'
import { agents } from '@/api/agents'
import { useAgentManage, useAgentSettings } from '@/flows/agents/settings'
import type { ComposerAttachment, ComposerContext, TurnInput } from '@/models/assistant-message'
import type { ComposerCommandFiles } from '@/models/composer-command'
import { filterComposerCommands, nextEnabledIndex, resolveComposerCommands, type ResolvedComposerCommand } from './composer-commands'

type MenuKind = '@' | '/' | null

export function activeComposerTrigger(value: string, cursor: number): { kind: MenuKind; query: string; start: number } | null {
  const before = value.slice(0, cursor)
  const match = /(?:^|\s)([@/])([^\s@/]*)$/.exec(before)
  return match ? { kind: match[1] as MenuKind, query: (match[2] ?? '').toLowerCase(), start: cursor - match[0].length + (match[0].startsWith(' ') ? 1 : 0) } : null
}

function isImage(file: File): boolean { return file.type.startsWith('image/') }

export function ProjectChatComposer({ agentId, isBusy, isLive, contextPercent, contextUsedTokens, contextWindow, onSend, onStop }: {
  agentId: string; isBusy: boolean; isLive: boolean; contextPercent: number; contextUsedTokens: number; contextWindow?: number
  onSend: (input: TurnInput) => void; onStop: () => void
}) {
  const [text, setText] = React.useState('')
  const [attachments, setAttachments] = React.useState<ComposerAttachment[]>([])
  const [skills, setSkills] = React.useState<string[]>([])
  const [plugins, setPlugins] = React.useState<string[]>([])
  const [mode, setMode] = React.useState<'plan' | 'execute' | undefined>()
  const [goal, setGoal] = React.useState<string | undefined>()
  const [goalAttached, setGoalAttached] = React.useState(false)
  const [menu, setMenu] = React.useState<MenuKind>(null)
  const [query, setQuery] = React.useState('')
  const [selected, setSelected] = React.useState(0)
  const textarea = React.useRef<HTMLTextAreaElement | null>(null)
  const manage = useAgentManage(agentId)
  const settings = useAgentSettings(agentId)
  const [commandFiles, setCommandFiles] = React.useState<ComposerCommandFiles | null>(null)
  const catalog = (settings.settings as { catalog?: { skills?: Array<{ path: string }>; extensions?: Array<{ path: string; manifest?: { title?: string; description?: string } }> } } | null)?.catalog
  const commands = React.useMemo(() => commandFiles
    ? resolveComposerCommands(menu === '/' ? commandFiles.slash : commandFiles.at, {
        skills: catalog?.skills ?? [], plugins: catalog?.extensions ?? [],
        activeSkills: (manage.settings?.skills as string[] | undefined) ?? [], activePlugins: (manage.settings?.extensions as string[] | undefined) ?? [],
      }) : [], [catalog, commandFiles, manage.settings, menu])
  const shown = React.useMemo(() => filterComposerCommands(commands, query), [commands, query])
  const highlighted = shown.length === 0 ? -1 : shown[Math.min(selected, shown.length - 1)]?.disabled
    ? nextEnabledIndex(shown, Math.min(selected, shown.length - 1) - 1, 1)
    : Math.min(selected, shown.length - 1)

  React.useEffect(() => {
    let active = true
    const load = () => void window.api.composerCommands.get().then((files) => { if (active) setCommandFiles(files) })
    load()
    const unsubscribe = window.api.composerCommands.onChanged(load)
    return () => { active = false; unsubscribe() }
  }, [])

  React.useEffect(() => {
    const project = manage.settings?.project as { goal?: string } | undefined
    if (project?.goal && !goal) { setGoal(project.goal); setGoalAttached(true) }
  }, [goal, manage.settings])

  const updateTrigger = (value: string, cursor: number) => {
    const trigger = activeComposerTrigger(value, cursor)
    setMenu(trigger?.kind ?? null); setQuery(trigger?.query ?? ''); setSelected(0)
  }
  const replaceTrigger = (): boolean => {
    const node = textarea.current; if (!node) return false
    const trigger = activeComposerTrigger(text, node.selectionStart)
    if (!trigger) return false
    const next = `${text.slice(0, trigger.start)}${text.slice(node.selectionStart)}`
    setText(next); setMenu(null)
    requestAnimationFrame(() => { node.focus(); node.setSelectionRange(trigger.start, trigger.start) })
    return true
  }
  const addAttachments = async (files: FileList | File[]) => {
    const next: ComposerAttachment[] = []
    for (const file of Array.from(files)) {
      const data = await new Promise<string>((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.readAsDataURL(file) })
      next.push(await agents.importAttachment(agentId, { name: file.name, mimeType: file.type, data }))
    }
    setAttachments((current) => [...current, ...next])
  }
  const pick = async (kind: 'file' | 'folder') => {
    const picked = await agents.pickAttachments(agentId, kind)
    setAttachments((current) => [...current, ...picked])
  }
  const choose = async (command: ResolvedComposerCommand) => {
    if (command.disabled) return
    if (!replaceTrigger()) setMenu(null)
    if (command.action === 'attachment') { await pick(command.value === 'folder' ? 'folder' : 'file'); return }
    if (command.action === 'goal') { setGoalAttached(true); return }
    if (command.action === 'mode' && (command.value === 'plan' || command.value === 'execute')) { setMode(command.value); return }
    if (command.action === 'skill' && command.value) { setSkills((current) => current.includes(command.value!) ? current : [...current, command.value!]); return }
    if (command.action === 'plugin' && command.value) setPlugins((current) => current.includes(command.value!) ? current : [...current, command.value!])
  }
  const context: ComposerContext = { attachments, skills, plugins, mode, goal }
  const canSend = (text.trim().length > 0 || attachments.length > 0) && isLive
  const editGoal = () => {
    const next = window.prompt('Project goal', goal ?? '')
    if (next?.trim()) { setGoal(next.trim()); manage.patch('project.goal', next.trim()) }
  }
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 w-full">
      <div className="relative rounded-3xl border border-border/60 bg-sidebar shadow-sm">
        {menu && <div className="absolute bottom-full left-0 right-0 mb-2 max-h-72 overflow-y-auto rounded-2xl border border-border bg-popover p-2 shadow-xl z-20">
          <span className="px-2 text-xs text-muted-foreground">{menu === '@' ? 'Add' : 'Skills'}</span>
          {shown.map((command, index) => <button key={command.id} type="button" disabled={command.disabled} title={command.disabledReason} onClick={() => void choose(command)} className={`flex w-full rounded-lg px-3 py-2 text-left text-sm ${command.disabled ? 'cursor-not-allowed opacity-45' : 'hover:bg-muted'} ${index === highlighted ? 'bg-muted' : ''}`}><span className="mr-3 text-muted-foreground">{command.action === 'skill' ? '/' : '@'}</span><span>{command.label}{command.description && <span className="ml-2 text-muted-foreground">{command.description}</span>}{command.disabledReason && <span className="ml-2 text-muted-foreground">{command.disabledReason}</span>}</span></button>)}
          {!shown.length && <span className="block px-3 py-2 text-sm text-muted-foreground">No matches</span>}
        </div>}
        {attachments.length > 0 && <div className="flex gap-2 overflow-x-auto px-4 pt-3">
          {attachments.map((attachment) => <div key={attachment.id} className="relative flex min-w-28 items-center gap-2 rounded-xl border border-border bg-background/40 p-2">
            {attachment.kind === 'image' ? <img src={`file://${attachment.path}`} className="size-12 rounded object-cover" /> : <span className="text-xl">{attachment.kind === 'folder' ? '▱' : '▤'}</span>}
            <span className="max-w-28 truncate text-xs">{attachment.name}</span>
            <button type="button" onClick={() => { if (attachment.kind !== 'folder') void agents.discardAttachment(agentId, attachment.id); setAttachments((current) => current.filter((item) => item.id !== attachment.id)) }} className="absolute -right-1 -top-1 rounded-full bg-background"><Icon icon={XIcon} className="size-4" /></button>
          </div>)}
        </div>}
        <textarea ref={textarea} value={text} placeholder="Message the project agent…" autoFocus
          onChange={(event) => { setText(event.target.value); updateTrigger(event.target.value, event.target.selectionStart) }}
          onSelect={(event) => updateTrigger(event.currentTarget.value, event.currentTarget.selectionStart)}
          onPaste={(event) => { const files = Array.from(event.clipboardData.files).filter(isImage); if (files.length) { event.preventDefault(); void addAttachments(files) } }}
          onDrop={(event) => { event.preventDefault(); void addAttachments(event.dataTransfer.files) }} onDragOver={(event) => event.preventDefault()}
          onKeyDown={(event) => { if (menu && event.key === 'Escape') { event.preventDefault(); setMenu(null); return } if (menu && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) { event.preventDefault(); setSelected(nextEnabledIndex(shown, highlighted, event.key === 'ArrowDown' ? 1 : -1)); return } if (menu && event.key === 'Enter') { event.preventDefault(); const item = shown[highlighted]; if (item) void choose(item); return } if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); if (canSend) { onSend({ text, composerContext: context }); setText(''); setAttachments([]); setSkills([]); setPlugins([]); setMode(undefined) } } }}
          className="min-h-24 w-full resize-none border-0 bg-transparent px-5 pt-4 pb-2 text-sm text-sidebar-foreground placeholder:text-muted-foreground outline-none" />
        <div className="flex items-center justify-between gap-3 px-5 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <button type="button" onClick={() => { setMenu('@'); setQuery('') }} className="text-sidebar-foreground/70 hover:text-sidebar-foreground"><Icon icon={PlusIcon} className="size-5" /></button>
            {mode && <Chip label={mode === 'plan' ? 'Plan' : 'Execute'} onRemove={() => setMode(undefined)} />}
            {skills.map((item) => <Chip key={item} label={item} onRemove={() => setSkills((current) => current.filter((value) => value !== item))} />)}
            {plugins.map((item) => <Chip key={item} label={item} onRemove={() => setPlugins((current) => current.filter((value) => value !== item))} />)}
            <ContextUsageRing percent={contextPercent} usedTokens={contextUsedTokens} maxTokens={contextWindow} />
            {goalAttached && <Chip label="Goal" onClick={editGoal} onRemove={() => { setGoalAttached(false); setGoal(undefined); manage.patch('project.goal', '') }} />}
          </div>
          <div className="flex items-center gap-4"><ModelPicker agentId={agentId} /><button className="text-sidebar-foreground/70"><HugeIcon icon={Mic02Icon} size={20} /></button><button type="button" onClick={isBusy ? onStop : () => { if (canSend) { onSend({ text, composerContext: context }); setText(''); setAttachments([]); setSkills([]); setPlugins([]); setMode(undefined) } }} disabled={!isBusy && !canSend} className="flex size-10 items-center justify-center rounded-full bg-foreground text-background disabled:opacity-40"><Icon icon={isBusy ? Stop : ArrowUpIcon} className="size-5" /></button></div>
        </div>
      </div>
    </div>
  )
}

function Chip({ label, onRemove, onClick }: { label: string; onRemove: () => void; onClick?: () => void }) { return <span className="flex max-w-32 items-center gap-1 truncate rounded-full bg-muted px-2 py-1 text-xs"><button type="button" className="truncate" onClick={onClick}>{label}</button><button type="button" onClick={onRemove}><Icon icon={XIcon} className="size-3" /></button></span> }
