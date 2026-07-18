import { toast } from 'sonner'

/** Toast shown after a provider API-key block is saved. */
export function notifyProviderBlockSaved(heading: string): void {
  toast.success(`${heading} saved`)
}

/** Toast shown after a provider API-key block is cleared. */
export function notifyProviderBlockCleared(heading: string): void {
  toast.success(`${heading} cleared`)
}
