import { copyText } from './copy-text'

/**
 * Copy a markdown table rendered as markdown or CSV.
 *
 * Silent — MarkdownTable renders its own inline "copied" indicator;
 * the standard toast would double up.
 *
 * The `format` parameter is reserved for future use (e.g. different
 * success labels per format); today every copy just goes through the
 * same clipboard path.
 */
export function copyTable(_format: 'md' | 'csv', text: string): Promise<boolean> {
  return copyText(text, { silent: true })
}
