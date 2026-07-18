import { toast } from 'sonner'

/**
 * Tiny helper for the placeholder "coming soon" toasts in the command
 * palette. Wraps `toast.info` so the component doesn't import `sonner`
 * directly — keeps the side-effect-in-flows invariant.
 */
export function showComingSoonToast(feature: string): void {
  toast.info(`${feature} — coming soon`)
}
