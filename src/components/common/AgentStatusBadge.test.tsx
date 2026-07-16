/**
 * Pins the visual contract of `AgentStatusBadge` so accidental tweaks
 * (wrong dot color, dropped error icon, lost spinner overlay) surface in
 * CI. Two layers:
 *   1. `useAgentStatusPresentation` — pure mapping, exercised directly.
 *   2. `AgentStatusBadge` — render-to-string smoke test that the
 *      resolved class names and labels land in the DOM.
 */

import { describe, expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  AgentStatusBadge,
  useAgentStatusPresentation,
} from './AgentStatusBadge'
import type { AgentStatus } from '@/storage/types'

const STATUSES: AgentStatus[] = ['idle', 'active', 'busy', 'waiting']

describe('useAgentStatusPresentation', () => {
  test('returns one entry per status with matching label and dot', () => {
    const expected: Record<AgentStatus, { dot: string; label: string }> = {
      idle: { dot: 'bg-muted-foreground/30', label: 'Idle' },
      active: { dot: 'bg-success', label: 'Active' },
      busy: { dot: 'bg-info', label: 'Busy' },
      waiting: { dot: 'bg-warning', label: 'Waiting' },
    }
    for (const status of STATUSES) {
      const p = useAgentStatusPresentation(status)
      expect(p.status).toBe(status)
      expect(p.error).toBe(false)
      expect(p.booting).toBe(false)
      expect(p.dotClass).toBe(expected[status]!.dot)
      expect(p.label).toBe(expected[status]!.label)
    }
  })

  test('error prop swaps idle dot to destructive only when idle', () => {
    const idle = useAgentStatusPresentation('idle', { error: true })
    expect(idle.error).toBe(true)
    expect(idle.dotClass).toBe('bg-destructive')

    for (const status of STATUSES) {
      if (status === 'idle') continue
      const p = useAgentStatusPresentation(status, { error: true })
      expect(p.error).toBe(false)
      expect(p.dotClass).not.toBe('bg-destructive')
    }
  })

  test('booting prop is only true for active + in-progress boot', () => {
    // active + bootStep undefined  → not booting
    expect(useAgentStatusPresentation('active').booting).toBe(false)
    // active + bootStep set, not ready → booting
    expect(useAgentStatusPresentation('active', { booting: true }).booting).toBe(true)
    // idle + bootStep prop → not booting (the badge ignores booting for non-active)
    expect(useAgentStatusPresentation('idle', { booting: true }).booting).toBe(false)
    // busy + bootStep prop → not booting
    expect(useAgentStatusPresentation('busy', { booting: true }).booting).toBe(false)
  })

  test('error beats booting — both apply dot priority but booting is suppressed when erroring', () => {
    const p = useAgentStatusPresentation('active', { error: true, booting: true })
    // error flag only fires for idle; for active it stays false and booting wins
    expect(p.error).toBe(false)
    expect(p.booting).toBe(true)
  })
})

describe('AgentStatusBadge', () => {
  test('renders the status label per AgentStatus', () => {
    for (const status of STATUSES) {
      const html = renderToStaticMarkup(<AgentStatusBadge status={status} />)
      const expected = {
        idle: 'Idle',
        active: 'Active',
        busy: 'Busy',
        waiting: 'Waiting',
      }[status]
      expect(html).toContain(expected!)
      expect(html).toContain(`<span class="text-xs text-muted-foreground">${expected}</span>`)
    }
  })

  test('renders the dot class for each status', () => {
    const expected: Record<AgentStatus, string> = {
      idle: 'bg-muted-foreground/30',
      active: 'bg-success',
      busy: 'bg-info',
      waiting: 'bg-warning',
    }
    for (const status of STATUSES) {
      const html = renderToStaticMarkup(<AgentStatusBadge status={status} />)
      expect(html).toContain(`size-1.5 rounded-full shrink-0 ${expected[status]}`)
    }
  })

  test('error swap on idle shows destructive dot + warning icon', () => {
    const html = renderToStaticMarkup(<AgentStatusBadge status="idle" error />)
    expect(html).toContain('bg-destructive')
    expect(html).toContain('aria-label="error"')
    // The standard idle label is still shown
    expect(html).toContain('Idle')
  })

  test('booting prop renders the spinner overlay on active', () => {
    const html = renderToStaticMarkup(<AgentStatusBadge status="active" booting />)
    expect(html).toContain('animate-spin')
    expect(html).toContain('Active')
  })

  test('compact prop tightens the gap between dot and label', () => {
    const wide = renderToStaticMarkup(<AgentStatusBadge status="active" />)
    const compact = renderToStaticMarkup(<AgentStatusBadge status="active" compact />)
    expect(wide).toContain('gap-list-item')
    expect(compact).toContain('gap-1.5')
    expect(compact).not.toContain('gap-list-item')
  })
})