import * as React from 'react'
import {
  BrainIcon,
  TerminalIcon,
  FileIcon,
  FileEditIcon,
  PencilIcon,
  SearchIcon,
  FolderIcon,
  GlobeIcon,
  WrenchIcon,
  FileTextIcon,
  ImageIcon,
} from 'lucide-react'

type IconComponent = React.ComponentType<{ className?: string }>

export interface ToolDisplay {
  verb: string
  liveVerb: string
  icon: IconComponent
  firstArg: (args: unknown) => string | null
}

function str(obj: unknown, key: string): string | null {
  if (!obj || typeof obj !== 'object') return null
  const v = (obj as Record<string, unknown>)[key]
  return typeof v === 'string' ? v : null
}

export const TOOL_DISPLAY: Record<string, ToolDisplay> = {
  bash: { verb: 'Ran command', liveVerb: 'Running command', icon: TerminalIcon, firstArg: (a) => str(a, 'command') },
  read: { verb: 'Read', liveVerb: 'Reading', icon: FileIcon, firstArg: (a) => str(a, 'path') },
  write: { verb: 'Wrote', liveVerb: 'Writing', icon: FileEditIcon, firstArg: (a) => str(a, 'path') },
  edit: { verb: 'Edited', liveVerb: 'Editing', icon: PencilIcon, firstArg: (a) => str(a, 'path') },
  grep: { verb: 'Searched', liveVerb: 'Searching', icon: SearchIcon, firstArg: (a) => str(a, 'pattern') },
  find: { verb: 'Found', liveVerb: 'Checking', icon: SearchIcon, firstArg: (a) => str(a, 'pattern') },
  ls: { verb: 'Listed', liveVerb: 'Checking', icon: FolderIcon, firstArg: (a) => str(a, 'path') },
  web_search: {
    verb: 'Fetched',
    liveVerb: 'Fetching',
    icon: GlobeIcon,
    firstArg: (a) => str(a, 'query') ?? str(a, 'searchQuery'),
  },
  fetch: {
    verb: 'Fetched',
    liveVerb: 'Fetching',
    icon: GlobeIcon,
    firstArg: (a) => str(a, 'query') ?? str(a, 'url'),
  },
  set_project_current_work: {
    verb: 'Planning',
    liveVerb: 'Planning',
    icon: BrainIcon,
    firstArg: (a) => str(a, 'summary'),
  },
}

export const THINKING_ICON: IconComponent = BrainIcon
export const TEXT_ICON: IconComponent = FileTextIcon
export const IMAGE_ICON: IconComponent = ImageIcon
export const FALLBACK_ICON: IconComponent = WrenchIcon

export function getToolDisplay(name: string): ToolDisplay | undefined {
  return TOOL_DISPLAY[name]
}

/**
 * Best-effort human label for an unknown tool. Replaces `_` and `-` with
 * spaces and title-cases. Returns "Tool" for empty/whitespace input so
 * the row always has a label.
 */
export function formatToolName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return 'Tool'
  return trimmed
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
