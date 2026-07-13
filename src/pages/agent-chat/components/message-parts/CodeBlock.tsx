import { Button } from '@/components/ui/button'
import { HugeIcon } from '@/components/ui/huge-icon'
import { Copy01Icon } from '@hugeicons/core-free-icons'

interface CodeBlockProps {
  lang: string
  code: string
}

export function CodeBlock({ lang, code }: CodeBlockProps) {
  return (
    <div className="bg-chat-bubble-code-bg rounded-chat-code-block overflow-hidden border border-chat-bubble-code-header-bg">
      <div className="flex items-center justify-between bg-chat-bubble-code-header-bg px-3 py-1.5">
        <span className="text-[11px] text-muted-foreground font-mono uppercase tracking-wide">
          {lang}
        </span>
        <Button
          size="icon-sm"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground h-6 w-6 border-0"
          aria-label="Copy code"
        >
          <HugeIcon icon={Copy01Icon} size={12} className="size-3" />
        </Button>
      </div>
      <pre className="px-3 py-2 text-xs font-mono overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  )
}
