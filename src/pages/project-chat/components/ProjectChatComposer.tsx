import * as React from 'react'
import { ArrowUpIcon, CodeIcon, FolderIcon, LightbulbIcon, PaperclipIcon, PlugIcon, PlusIcon, PuzzlePieceIcon, RocketLaunchIcon, Stop, TargetIcon, XIcon } from '@phosphor-icons/react'
import { Icon } from '@/components/ui/icon'
import { HugeIcon } from '@/components/ui/huge-icon'
import { Mic02Icon } from '@hugeicons/core-free-icons'
import { ModelPicker } from '@/components/layout/composer/ModelPicker'
import { ContextUsageRing } from '@/components/layout/composer/ContextUsageRing'
import { ChatComposerFrame, ChatComposerToolbar, composerIconButtonClass, composerSendButtonClass, composerTextareaClass, useComposerTextareaAutosize } from '@/components/layout/composer/ChatComposer'
import { agents } from '@/api/agents'
import { useAgentManage } from '@/flows/agents/settings'
import { useMarketplace } from '@/flows/marketplace'
import type { ComposerAttachment, ComposerContext, TurnInput } from '@/models/assistant-message'
import type { ComposerCommandFiles } from '@/models/composer-command'
import type { MarketplaceCapabilityRef } from '@/models/marketplace'
import { filterComposerCommands, groupComposerCommands, nextEnabledIndex, resolveComposerCommands, type ResolvedComposerCommand } from './composer-commands'

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
  const [skills, setSkills] = React.useState<MarketplaceCapabilityRef[]>([])
  const [plugins, setPlugins] = React.useState<MarketplaceCapabilityRef[]>([])
  const [mode, setMode] = React.useState<'plan' | 'execute' | undefined>()
  const [goal, setGoal] = React.useState<string | undefined>()
  const [goalAttached, setGoalAttached] = React.useState(false)
  const [menu, setMenu] = React.useState<MenuKind>(null)
  const [query, setQuery] = React.useState('')
  const [selected, setSelected] = React.useState(0)
  const [isPreparing, setIsPreparing] = React.useState(false)
  const [capabilityError, setCapabilityError] = React.useState<string | null>(null)
  const textarea = React.useRef<HTMLTextAreaElement | null>(null)
  useComposerTextareaAutosize(textarea, text)
  const manage = useAgentManage(agentId)
  const { items: marketplaceItems, activate } = useMarketplace()
  const [commandFiles, setCommandFiles] = React.useState<ComposerCommandFiles | null>(null)
  const commands = React.useMemo(() => commandFiles
    ? resolveComposerCommands(menu === '/' ? commandFiles.slash : commandFiles.at, {
        capabilities: marketplaceItems,
      }) : [], [commandFiles, marketplaceItems, menu])
  const shown = React.useMemo(() => filterComposerCommands(commands, query), [commands, query])
  const groups = React.useMemo(() => groupComposerCommands(shown), [shown])
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
    if ((command.action === 'skill' || command.action === 'plugin') && command.value && command.capability) {
      setIsPreparing(true); setCapabilityError(null)
      try {
        const result = await activate(agentId, command.value)
        const setCapabilities = command.action === 'skill' ? setSkills : setPlugins
        setCapabilities((current) => current.some((item) => item.id === result.capability.id) ? current : [...current, result.capability])
      } catch (cause) { setCapabilityError(cause instanceof Error ? cause.message : String(cause)) }
      finally { setIsPreparing(false) }
    }
  }
  const context: ComposerContext = { attachments, skills, plugins, mode, goal }
  const canSend = (text.trim().length > 0 || attachments.length > 0) && isLive && !isPreparing
  const editGoal = () => {
    const next = window.prompt('Project goal', goal ?? '')
    if (next?.trim()) { setGoal(next.trim()); manage.patch('project.goal', next.trim()) }
  }
  return (
    <ChatComposerFrame>
      <div className="relative">
        {menu && <ComposerCommandMenu
          groups={groups}
          highlighted={highlighted}
          isPreparing={isPreparing}
          onChoose={choose}
          shown={shown}
        />}
        {attachments.length > 0 && <div className="flex gap-2 overflow-x-auto px-4 pt-3 pb-1">
          {attachments.map((attachment) => <div key={attachment.id} className="relative flex min-w-28 shrink-0 items-center gap-2 rounded-xl border border-border bg-background/40 p-2">
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
          className={composerTextareaClass} />
        <ChatComposerToolbar>
          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
            <button type="button" aria-label="Add attachment or command" onClick={() => { setMenu('@'); setQuery('') }} className={composerIconButtonClass}><Icon icon={PlusIcon} className="size-5" /></button>
            {mode && <Chip label={mode === 'plan' ? 'Plan' : 'Execute'} onRemove={() => setMode(undefined)} />}
            {skills.map((item) => <Chip key={item.id} label={item.label} prefix="/" onRemove={() => setSkills((current) => current.filter((value) => value.id !== item.id))} />)}
            {plugins.map((item) => <Chip key={item.id} label={item.label} prefix="@" onRemove={() => setPlugins((current) => current.filter((value) => value.id !== item.id))} />)}
            {goalAttached && <Chip label="Goal" onClick={editGoal} onRemove={() => { setGoalAttached(false); setGoal(undefined); manage.patch('project.goal', '') }} />}
          </div>
          {capabilityError && <span className="absolute -top-6 left-2 text-xs text-destructive">{capabilityError}</span>}
          <div className="flex shrink-0 items-center gap-1"><ContextUsageRing percent={contextPercent} usedTokens={contextUsedTokens} maxTokens={contextWindow} size={18} className="size-8" /><ModelPicker agentId={agentId} /><button type="button" aria-label="Voice input" className={composerIconButtonClass}><HugeIcon icon={Mic02Icon} size={18} /></button><button type="button" aria-label={isBusy ? 'Stop response' : 'Send message'} onClick={isBusy ? onStop : () => { if (canSend) { onSend({ text, composerContext: context }); setText(''); setAttachments([]); setSkills([]); setPlugins([]); setMode(undefined) } }} disabled={!isBusy && !canSend} className={`${composerSendButtonClass} ${isBusy ? 'bg-chat-composer-stop-bg hover:bg-chat-composer-stop-hover' : 'bg-chat-composer-send-bg hover:bg-chat-composer-send-hover disabled:bg-muted'}`}><Icon icon={isBusy ? Stop : ArrowUpIcon} className="size-5 text-white" /></button></div>
        </ChatComposerToolbar>
      </div>
    </ChatComposerFrame>
  )
}

function ComposerCommandMenu({
  groups,
  highlighted,
  isPreparing,
  onChoose,
  shown,
}: {
  groups: ReturnType<typeof groupComposerCommands>
  highlighted: number
  isPreparing: boolean
  onChoose: (command: ResolvedComposerCommand) => Promise<void>
  shown: ResolvedComposerCommand[]
}) {
  return (
    <div
      aria-label="Composer commands"
      className="absolute bottom-full left-0 right-0 z-20 mb-2 max-h-[min(36rem,calc(100vh-10rem))] overflow-y-auto rounded-[28px] border border-[#303030] bg-[#1E1E1E] p-2 shadow-2xl shadow-black/35"
      role="listbox"
    >
      {groups.map((group) => (
        <section key={group.id} className="px-1 pb-3 pt-1 first:pt-2 last:pb-1">
          <h2 className="mb-1 px-2 text-sm font-normal text-[#7F7F7F]">{group.label}</h2>
          <div className="flex flex-col gap-0.5">
            {group.commands.map((command) => (
              <ComposerCommandRow
                key={command.id}
                command={command}
                highlighted={shown.indexOf(command) === highlighted}
                onChoose={onChoose}
              />
            ))}
          </div>
        </section>
      ))}
      {shown.length === 0 && <p className="px-3 py-3 text-base text-[#8A8A8A]">No matches</p>}
      {isPreparing && <p className="px-3 pb-2 pt-1 text-sm text-[#8A8A8A]">Preparing capability for this agent…</p>}
    </div>
  )
}

function ComposerCommandRow({
  command,
  highlighted,
  onChoose,
}: {
  command: ResolvedComposerCommand
  highlighted: boolean
  onChoose: (command: ResolvedComposerCommand) => Promise<void>
}) {
  const presentation = commandPresentation(command)
  return (
    <button
      aria-selected={highlighted}
      className={`flex min-h-12 w-full select-none items-center gap-3 rounded-2xl px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
        command.disabled
          ? 'cursor-not-allowed opacity-40'
          : highlighted
            ? 'bg-[#2A2A2A] text-[#F5F5F5]'
            : 'text-[#E8E8E8] hover:bg-[#272727]'
      }`}
      disabled={command.disabled}
      onClick={() => void onChoose(command)}
      role="option"
      title={command.disabledReason}
      type="button"
    >
      <span className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${presentation.tone}`}>
        <Icon icon={presentation.icon} className="size-5" weight="regular" />
      </span>
      <span className="flex min-w-0 items-baseline gap-2 overflow-hidden">
        <span className="shrink-0 text-base leading-6">{command.label}</span>
        {command.description && <span className="truncate text-base leading-6 text-[#898989]">{command.description}</span>}
      </span>
    </button>
  )
}

function commandPresentation(command: ResolvedComposerCommand) {
  if (command.action === 'attachment') {
    return { icon: command.value === 'folder' ? FolderIcon : PaperclipIcon, tone: 'text-[#D9D9D9]' }
  }
  if (command.action === 'goal') return { icon: TargetIcon, tone: 'text-[#D9D9D9]' }
  if (command.action === 'mode') {
    return command.value === 'plan'
      ? { icon: LightbulbIcon, tone: 'text-[#D9D9D9]' }
      : { icon: RocketLaunchIcon, tone: 'text-[#D9D9D9]' }
  }
  if (command.action === 'skill') return { icon: CodeIcon, tone: 'bg-violet-500/15 text-violet-300' }
  return command.capability?.kind === 'mcp-adapter'
    ? { icon: PlugIcon, tone: 'bg-emerald-500/15 text-emerald-300' }
    : { icon: PuzzlePieceIcon, tone: 'bg-sky-500/15 text-sky-300' }
}

function Chip({ label, prefix = '@', onRemove, onClick }: { label: string; prefix?: '@' | '/'; onRemove: () => void; onClick?: () => void }) {
  return (
    <span className="flex h-8 max-w-40 shrink-0 items-center gap-1 rounded-full border border-border/70 bg-sidebar-accent px-2 text-xs font-semibold text-sidebar-foreground">
      <span aria-hidden="true" className="text-sidebar-foreground/60">{prefix}</span>
      <button type="button" className="min-w-0 flex-1 truncate text-left" onClick={onClick}>{label}</button>
      <button type="button" aria-label={`Remove ${label}`} onClick={onRemove} className="flex size-4 shrink-0 items-center justify-center rounded-full text-sidebar-foreground/60 transition-colors hover:bg-background/60 hover:text-sidebar-foreground">
        <Icon icon={XIcon} className="size-3" />
      </button>
    </span>
  )
}
