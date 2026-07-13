interface CodeBlockProps {
  lang: string
  code: string
}

export function CodeBlock({ lang, code }: CodeBlockProps) {
  return (
    <div className="bg-chat-bubble-code-bg rounded-chat-code-block overflow-hidden">
      <div className="px-3 py-1.5 text-[11px] text-muted-foreground font-mono uppercase tracking-wide">
        {lang}
      </div>
      <pre className="px-3 py-2 text-xs font-mono overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  )
}
