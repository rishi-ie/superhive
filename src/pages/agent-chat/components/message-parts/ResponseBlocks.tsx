import * as React from 'react'
import { MarkdownPart } from './MarkdownPart'
import { ImagePart } from './ImagePart'
import { CompactionCard } from './CompactionCard'
import type { ResponseBlock } from '@/models/assistant-message'

interface ResponseBlocksProps {
  blocks: readonly ResponseBlock[]
  /** True once the message is frozen. When false, blocks render in a
   *  streaming-style (markdown still streams; images show; compaction
   *  cards show). Caller is expected to hide this whole component in
   *  state 1 — this is the "always visible" path. */
  frozen: boolean
}

/**
 * Renders the assistant's prose response below the activity timeline.
 * Each block is rendered independently: text → MarkdownPart, image →
 * ImagePart, compaction-summary → CompactionCard.
 *
 * Memoized on `blocks` reference + `frozen` so frozen rows skip re-renders
 * on every notify.
 */
function ResponseBlocksBase({ blocks }: ResponseBlocksProps) {
  if (blocks.length === 0) return null
  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === 'text') {
          return <MarkdownPart key={`text-${i}`} source={block.text} />
        }
        if (block.type === 'image') {
          return <ImagePart key={`image-${i}`} data={block.data} mimeType={block.mimeType} />
        }
        if (block.type === 'compaction-summary') {
          return (
            <CompactionCard
              key={`compaction-${i}`}
              tokensBefore={block.tokensBefore}
              summary={block.summary}
            />
          )
        }
        return null
      })}
    </>
  )
}

export const ResponseBlocks = React.memo(
  ResponseBlocksBase,
  (prev, next) => prev.blocks === next.blocks && prev.frozen === next.frozen,
)
