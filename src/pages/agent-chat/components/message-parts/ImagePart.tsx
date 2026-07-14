import * as React from 'react'
import { ImageLightbox } from './ImageLightbox'

/**
 * Render an inline image attachment. Clicking the thumbnail opens a
 * lightbox dialog with the full image (Phase 7.2).
 *
 * Pi's `image-attachment` event delivers images as base64 data + a
 * mime-type (e.g. `image/png`, `image/jpeg`).
 */
interface ImagePartProps {
  data: string
  mimeType: string
  alt?: string
}

export function ImagePart({ data, mimeType, alt }: ImagePartProps) {
  const [open, setOpen] = React.useState(false)
  const src = `data:${mimeType};base64,${data}`
  const label = alt ?? mimeType
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block cursor-zoom-in"
      >
        <img
          src={src}
          alt={label}
          loading="lazy"
          className="max-h-[400px] rounded-card border border-border"
        />
      </button>
      <ImageLightbox open={open} onOpenChange={setOpen} src={src} alt={label} />
    </>
  )
}
