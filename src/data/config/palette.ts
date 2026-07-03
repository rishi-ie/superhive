/**
 * DARK_PALETTE — single source of truth for the dark theme.
 * Change any value here, the entire app re-skins.
 *
 * Usage: import { DARK_PALETTE } from '@/data/config/palette';
 */
export const DARK_PALETTE = {
  background:      '#121212',
  surface:         '#1A1A1A',
  surfaceAlt:      '#171717',
  textPrimary:     '#E0E0E0',
  textSecondary:   '#888888',
  accent:          '#81ACEC',
  border:          '#2D2D2D',
  chart1:          '#81ACEC',
  chart2:          '#50C878',
  chart3:          '#E2B73A',
  chart4:          '#A78BFA',
  chart5:          '#E06B6B',
  destructive:     '#dc4444',
  highlightMatch:  'rgba(129, 172, 236, 0.20)',
  highlightActive: 'rgba(129, 172, 236, 0.50)',
} as const;
