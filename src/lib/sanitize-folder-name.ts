/**
 * Sanitize a folder name into a safe filesystem name.
 *
 * Rules:
 * - Trim whitespace
 * - Block path traversal: returns '' if input is '.', '..', empty,
 *   or contains '/' or '\\'
 * - Lowercase the whole string
 * - Replace any run of chars outside [a-z0-9._-] with a single '-'
 * - Collapse repeated '-'
 * - Trim leading/trailing '-' (but a leading '.' is preserved)
 *
 * Examples:
 *   sanitizeFolderName('My Agent')    -> 'my-agent'
 *   sanitizeFolderName('.agent')     -> '.agent'
 *   sanitizeFolderName('My/Agent!')  -> 'my-agent'
 *   sanitizeFolderName('..')         -> ''   (caller throws)
 *   sanitizeFolderName('agent.sh')   -> 'agent.sh'
 *   sanitizeFolderName('  ')         -> ''   (caller throws)
 */
export function sanitizeFolderName(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (trimmed === '.' || trimmed === '..') return ''
  if (trimmed.includes('/') || trimmed.includes('\\')) return ''

  return trimmed
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}