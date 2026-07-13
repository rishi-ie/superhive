import * as React from 'react'
import { Button } from '@/components/ui/button'
import { HugeIcon } from '@/components/ui/huge-icon'
import { Copy01Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'

interface CodeBlockProps {
  lang: string
  code: string
}

export function CodeBlock({ lang, code }: CodeBlockProps) {
  const [expanded, setExpanded] = React.useState(false)
  const handleCopy = React.useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    navigator.clipboard
      .writeText(code)
      .then(() => toast.success('Copied'))
      .catch(() => toast.error('Copy failed'))
  }, [code])

  const lines = React.useMemo(() => code.split('\n'), [code])
  const COLLAPSE_THRESHOLD = 50
  const isLong = lines.length > COLLAPSE_THRESHOLD
  const visibleLines = !isLong || expanded ? lines : lines.slice(0, COLLAPSE_THRESHOLD)

  return (
    <div className="bg-chat-bubble-code-bg rounded-chat-code-block overflow-hidden border border-chat-bubble-code-header-bg">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-chat-bubble-code-header-bg px-3 py-1.5">
        <span className="text-[11px] text-muted-foreground font-mono uppercase tracking-wide">
          {lang}
        </span>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={handleCopy}
          className="text-muted-foreground hover:text-foreground h-6 w-6 border-0"
          aria-label="Copy code"
        >
          <HugeIcon icon={Copy01Icon} size={12} className="size-3" />
        </Button>
      </div>
      <pre className="max-h-[500px] overflow-auto px-3 py-2 text-xs font-mono">
        <code>
          {visibleLines.map((line, i) => (
            <span key={i} className="block">
              <span className="inline-block w-7 text-right pr-2 text-muted-foreground/60 select-none">
                {i + 1}
              </span>
              {line}
              {'\n'}
            </span>
          ))}
        </code>
      </pre>
      {isLong && !expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="block w-full text-center text-xs text-muted-foreground hover:text-foreground py-1.5 bg-chat-bubble-code-header-bg border-t border-border cursor-pointer"
        >
          Show all {lines.length} lines
        </button>
      ) : null}
    </div>
  )
}
