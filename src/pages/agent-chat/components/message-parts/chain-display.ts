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
  icon: IconComponent
  firstArg: (args: unknown) => string | null
}

function str(obj: unknown, key: string): string | null {
  if (!obj || typeof obj !== 'object') return null
  const v = (obj as Record<string, unknown>)[key]
  return typeof v === 'string' ? v : null
}

export const TOOL_DISPLAY: Record<string, ToolDisplay> = {
  bash: { verb: 'Bash', icon: TerminalIcon, firstArg: (a) => str(a, 'command') },
  read: { verb: 'Read', icon: FileIcon, firstArg: (a) => str(a, 'path') },
  write: { verb: 'Wrote', icon: FileEditIcon, firstArg: (a) => str(a, 'path') },
  edit: { verb: 'Edited', icon: PencilIcon, firstArg: (a) => str(a, 'path') },
  grep: { verb: 'Searched', icon: SearchIcon, firstArg: (a) => str(a, 'pattern') },
  find: { verb: 'Found', icon: SearchIcon, firstArg: (a) => str(a, 'pattern') },
  ls: { verb: 'Listed', icon: FolderIcon, firstArg: (a) => str(a, 'path') },
  web_search: {
    verb: 'Fetched',
    icon: GlobeIcon,
    firstArg: (a) => str(a, 'query') ?? str(a, 'searchQuery'),
  },
  fetch: {
    verb: 'Fetched',
    icon: GlobeIcon,
    firstArg: (a) => str(a, 'query') ?? str(a, 'url'),
  },
}

export const THINKING_ICON: IconComponent = BrainIcon
export const TEXT_ICON: IconComponent = FileTextIcon
export const IMAGE_ICON: IconComponent = ImageIcon
export const FALLBACK_ICON: IconComponent = WrenchIcon

export function getToolDisplay(name: string): ToolDisplay | undefined {
  return TOOL_DISPLAY[name]
}
