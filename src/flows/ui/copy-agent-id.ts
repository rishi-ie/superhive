import { copyText } from './copy-text'

/** Copy an agent's id to the clipboard. */
export function copyAgentId(id: string): Promise<boolean> {
  return copyText(id, { successLabel: 'Copied agent ID' })
}
