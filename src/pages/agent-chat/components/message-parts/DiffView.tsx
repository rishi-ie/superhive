interface DiffViewProps {
  diff: string
}

export function DiffView({ diff }: DiffViewProps) {
  return <pre className="font-mono text-xs whitespace-pre">{diff}</pre>
}
