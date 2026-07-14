import * as React from 'react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'

/**
 * Render an inline image attachment. Clicking the thumbnail opens a
 * lightbox dialog with the full image (Phase 7.2).
 *
 * Pi's `image-attachment` event delivers images as base64 data + a
 * mime-type (e.g. `image/png`, `image/jpeg`). For now we render a
 * max-400px-wide thumbnail in the chat scroll area.
 */
interface ImagePartProps {
  data: string
  mimeType: string
}

export function ImagePart({ data, mimeType }: ImagePartProps) {
  const [open, setOpen] = React.useState(false)
  const src = `data:${mimeType};base64,${data}`
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block cursor-zoom-in"
      >
        <img
          src={src}
          className="max-h-[400px] rounded-card border border-border"
        />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={true}
          className="max-w-[90vw] max-h-[90vh] bg-transparent border-0 shadow-none p-0"
          overlayClassName="bg-black/80"
        >
          <img src={src} className="max-w-[90vw] max-h-[90vh] object-contain" />
        </DialogContent>
      </Dialog>
    </>
  )
}
