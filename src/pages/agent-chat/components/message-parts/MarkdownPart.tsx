import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownPartProps {
  source: string
}

export function MarkdownPart({ source }: MarkdownPartProps) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {source}
    </ReactMarkdown>
  )
}
