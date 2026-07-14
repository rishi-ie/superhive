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
  return (
    <img
      src={`data:${mimeType};base64,${data}`}
      className="max-h-[400px] rounded-card border border-border"
    />
  )
}
