interface ThinkingPartProps {
  text: string
  isStreaming: boolean
}

export function ThinkingPart({ text }: ThinkingPartProps) {
  return (
    <div className="text-sm">
      {text}
    </div>
  )
}
