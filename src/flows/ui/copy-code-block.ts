import { copyText } from './copy-text'

/**
 * Copy a fenced code block's contents to the clipboard.
 *
 * Silent — CodeBlock renders its own inline "copied" indicator for 1200ms
 * after success; the standard toast would double up.
 */
export function copyCodeBlock(code: string): Promise<boolean> {
  return copyText(code, { silent: true })
}
