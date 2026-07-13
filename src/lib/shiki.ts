import type { Highlighter } from 'shiki'

/** Languages pre-loaded eagerly. Keep this small — each lang adds ~200KB. */
const LANGS = [
  'ts',
  'tsx',
  'js',
  'jsx',
  'json',
  'bash',
  'shell',
  'html',
  'css',
  'python',
  'markdown',
  'yaml',
] as const

const THEMES = ['github-light', 'github-dark'] as const

let highlighterPromise: Promise<Highlighter> | null = null

/**
 * Lazy-loaded singleton. We construct the highlighter on first use to keep
 * cold-start fast; subsequent calls resolve to the same instance. The
 * language list covers >95% of what Pi emits in agent sessions — extending
 * this set is cheaper than paying the per-language cost on every block.
 *
 * Themes switch on demand via `loadTheme()` (added in P3.9.8).
 */
export function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = import('shiki').then((mod) =>
      mod.createHighlighter({
        themes: [...THEMES],
        langs: [...LANGS],
      }),
    )
  }
  return highlighterPromise
}
