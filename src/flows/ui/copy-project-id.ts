import { copyText } from './copy-text'

/** Copy a project's id to the clipboard. */
export function copyProjectId(id: string): Promise<boolean> {
  return copyText(id, { successLabel: 'Copied project ID' })
}
