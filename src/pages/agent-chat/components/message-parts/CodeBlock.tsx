import * as React from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { HugeIcon } from '@/components/ui/huge-icon'
import { Copy01Icon, CheckIcon } from '@hugeicons/core-free-icons'
import { getHighlighter } from '@/lib/shiki'
import { copyCodeBlock } from '@/flows/ui/copy-code-block'

interface CodeBlockProps {
  lang: string
  code: string
  wrap?: boolean
}

function useResolvedTheme(): 'github-light' | 'github-dark' {
  const [theme, setTheme] = React.useState<'github-light' | 'github-dark'>(() => {
    if (typeof document === 'undefined') return 'github-light'
    return document.documentElement.classList.contains('dark') ? 'github-dark' : 'github-light'
  })
  React.useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    const observer = new MutationObserver(() => {
      setTheme(root.classList.contains('dark') ? 'github-dark' : 'github-light')
    })
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  return theme
}

export function CodeBlock({ lang, code, wrap = false }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false)
  const [highlighted, setHighlighted] = React.useState<string | null>(null)
  const [isWrapped, setIsWrapped] = React.useState(wrap)
  const copiedTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const theme = useResolvedTheme()

  const handleCopy = React.useCallback(async () => {
    const ok = await copyCodeBlock(code)
    if (!ok) {
      setCopied(false)
      return
    }
    if (copiedTimerRef.current !== null) clearTimeout(copiedTimerRef.current)
    setCopied(true)
    copiedTimerRef.current = setTimeout(() => {
      setCopied(false)
      copiedTimerRef.current = null
    }, 1200)
  }, [code])

  React.useEffect(() => {
    let cancelled = false
    getHighlighter()
      .then((h) => {
        if (cancelled) return
        const loaded = h.getLoadedLanguages()
        const resolved = loaded.includes(lang as never) ? lang : 'text'
        setHighlighted(h.codeToHtml(code, { lang: resolved, theme }))
      })
      .catch(() => {
        if (cancelled) return
        setHighlighted(null)
      })
    return () => {
      cancelled = true
    }
  }, [code, lang, theme])

  React.useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== null) {
        clearTimeout(copiedTimerRef.current)
        copiedTimerRef.current = null
      }
    }
  }, [])

  const copyLabel = copied ? 'Copied' : 'Copy code'
  const wrapLabel = isWrapped ? 'Disable line wrap' : 'Wrap lines'

  return (
    <div className="bg-chat-bubble-code-bg rounded-chat-code-block overflow-hidden border border-chat-bubble-code-header-bg my-2">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-chat-bubble-code-header-bg px-3 py-1.5">
        <span className="text-[11px] text-muted-foreground font-mono uppercase tracking-wide">
          {lang}
        </span>
        <span className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger
              asChild
            >
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground h-6 w-6 inline-flex items-center justify-center border-0 bg-transparent"
                aria-pressed={isWrapped}
                onClick={() => setIsWrapped((v) => !v)}
                aria-label={wrapLabel}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="17 10 21 14 17 18" />
                  <path d="M3 4v7a4 4 0 0 0 4 4h14" />
                </svg>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">{wrapLabel}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground h-6 w-6 inline-flex items-center justify-center border-0 bg-transparent"
                onClick={handleCopy}
                aria-label={copyLabel}
              >
                {copied ? (
                  <HugeIcon icon={CheckIcon} size={12} className="size-3 text-chat-status-success" />
                ) : (
                  <HugeIcon icon={Copy01Icon} size={12} className="size-3" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">{copyLabel}</TooltipContent>
          </Tooltip>
        </span>
      </div>
      {highlighted ? (
        <div
          className={`max-h-[500px] overflow-auto px-3 py-2 text-xs font-mono ${isWrapped ? 'whitespace-pre-wrap break-all' : ''}`}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      ) : (
        <pre
          className={`max-h-[500px] overflow-auto px-3 py-2 text-xs font-mono ${isWrapped ? 'whitespace-pre-wrap break-all' : ''}`}
        >
          <code>{code}</code>
        </pre>
      )}
    </div>
  )
}
