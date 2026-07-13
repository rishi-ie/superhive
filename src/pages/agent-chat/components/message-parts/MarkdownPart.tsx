interface MarkdownPartProps {
  source: string
}

export function MarkdownPart({ source }: MarkdownPartProps) {
  return <div>{source}</div>
}
