import * as React from 'react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { HugeIcon } from '@/components/ui/huge-icon'
import { ZoomInAreaIcon, ZoomOutAreaIcon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'

const MIN_ZOOM = 0.5
const MAX_ZOOM = 4
const ZOOM_STEP = 0.25

interface ImageLightboxProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  src: string
  alt: string
}

/**
 * Full-screen image preview with zoom in/out controls. Mounted once per
 * `<ImagePart>`; the parent owns the open state. Radix `Dialog` already
 * handles ESC + backdrop-click close (P7.2.2).
 */
export function ImageLightbox({ open, onOpenChange, src, alt }: ImageLightboxProps) {
  const [zoom, setZoom] = React.useState(1)
  const zoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)))
  const zoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)))
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className="max-w-[92vw] max-h-[92vh] bg-transparent border-0 shadow-none p-0 gap-2"
        overlayClassName="bg-black/80"
      >
        <div className="flex items-center justify-center overflow-auto">
          <img
            src={src}
            alt={alt}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
            className="max-w-[90vw] max-h-[80vh] object-contain"
          />
        </div>
        <div className="flex items-center justify-center gap-2">
          <Button
            size="icon-sm"
            variant="secondary"
            onClick={zoomOut}
            disabled={zoom <= MIN_ZOOM}
            title="Zoom out"
          >
            <HugeIcon icon={ZoomOutAreaIcon} size={16} className="size-4" />
          </Button>
          <span className="font-mono text-xs text-white/70 tabular-nums w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            size="icon-sm"
            variant="secondary"
            onClick={zoomIn}
            disabled={zoom >= MAX_ZOOM}
            title="Zoom in"
          >
            <HugeIcon icon={ZoomInAreaIcon} size={16} className="size-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
